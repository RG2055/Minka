import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
const worker = (await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`)).default;

class FakeStatement {
  constructor(database, sql) {
    this.database = database;
    this.sql = sql.replace(/\s+/g, " ").trim();
    this.values = [];
  }

  bind(...values) {
    this.values = values;
    return this;
  }

  async all() {
    const db = this.database;
    const sql = this.sql;
    if (sql.startsWith("INSERT INTO feedback_messages")) {
      const [clientId, shiftDay, kind, body, createdAt, editTokenHash] = this.values;
      if (!db.rows.some((row) => row.client_id === clientId)) {
        db.rows.push({
          id: db.nextId++,
          client_id: clientId,
          shift_day: shiftDay,
          kind,
          body,
          created_at: createdAt,
          edit_token_hash: editTokenHash
        });
      }
      return { results: [] };
    }
    if (sql === "SELECT edit_token_hash FROM feedback_messages WHERE client_id = ?1") {
      const row = db.rows.find((item) => item.client_id === this.values[0]);
      return { results: row ? [{ edit_token_hash: row.edit_token_hash }] : [] };
    }
    if (sql.startsWith("SELECT") && sql.includes("FROM feedback_messages WHERE client_id = ?1")) {
      const row = db.rows.find((item) => item.client_id === this.values[0]);
      return { results: row ? [{ ...row }] : [] };
    }
    if (sql.startsWith("UPDATE feedback_messages SET body")) {
      const [body, clientId] = this.values;
      const row = db.rows.find((item) => item.client_id === clientId);
      if (row) row.body = body;
      return { results: row ? [{ ...row }] : [] };
    }
    if (sql.startsWith("DELETE FROM feedback_messages")) {
      const index = db.rows.findIndex((item) => item.client_id === this.values[0]);
      if (index < 0) return { results: [] };
      const [deleted] = db.rows.splice(index, 1);
      return { results: [{ id: deleted.id }] };
    }
    throw new Error(`Unhandled SQL in FakeD1: ${sql}`);
  }
}

class FakeD1 {
  constructor() {
    this.rows = [];
    this.nextId = 1;
  }

  prepare(sql) {
    return new FakeStatement(this, sql);
  }

  async batch(statements) {
    const results = [];
    for (const statement of statements) results.push(await statement.all());
    return results;
  }
}

function apiRequest(method, body) {
  return new Request("https://feedback.test/api/feedback/message", {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

async function call(db, method, body) {
  const response = await worker.fetch(apiRequest(method, body), { DB: db });
  return { response, data: await response.json() };
}

const baseMessage = {
  date: "2026-08-10",
  kind: "comment",
  text: "Drošs komentārs",
  clientId: "client_secure_001"
};
const ownerToken = "A".repeat(43);
const attackerToken = "B".repeat(43);

test("new message stores only a token hash and returns no secret", async () => {
  const db = new FakeD1();
  const { response, data } = await call(db, "POST", { ...baseMessage, editToken: ownerToken });

  assert.equal(response.status, 201);
  assert.equal(data.ok, true);
  assert.equal(data.message.clientId, baseMessage.clientId);
  assert.equal("editToken" in data.message, false);
  assert.equal("editTokenHash" in data.message, false);
  assert.notEqual(db.rows[0].edit_token_hash, ownerToken);
  assert.match(db.rows[0].edit_token_hash, /^[a-f0-9]{64}$/);
});

test("public clientId is insufficient for PATCH or DELETE", async () => {
  const db = new FakeD1();
  await call(db, "POST", { ...baseMessage, editToken: ownerToken });

  const noToken = await call(db, "PATCH", { clientId: baseMessage.clientId, text: "uzlauzts" });
  assert.equal(noToken.response.status, 400);

  const wrongEdit = await call(db, "PATCH", {
    clientId: baseMessage.clientId,
    editToken: attackerToken,
    text: "uzlauzts"
  });
  assert.equal(wrongEdit.response.status, 403);
  assert.equal(db.rows[0].body, baseMessage.text);

  const wrongDelete = await call(db, "DELETE", {
    clientId: baseMessage.clientId,
    editToken: attackerToken
  });
  assert.equal(wrongDelete.response.status, 403);
  assert.equal(db.rows.length, 1);
});

test("the private token authorizes owner edit and delete", async () => {
  const db = new FakeD1();
  await call(db, "POST", { ...baseMessage, editToken: ownerToken });

  const edited = await call(db, "PATCH", {
    clientId: baseMessage.clientId,
    editToken: ownerToken,
    text: "Rediģēts droši"
  });
  assert.equal(edited.response.status, 200);
  assert.equal(edited.data.message.text, "Rediģēts droši");

  const deleted = await call(db, "DELETE", {
    clientId: baseMessage.clientId,
    editToken: ownerToken
  });
  assert.equal(deleted.response.status, 200);
  assert.equal(db.rows.length, 0);
});

test("legacy messages stay readable but cannot be claimed with a new token", async () => {
  const db = new FakeD1();
  const created = await call(db, "POST", baseMessage);
  assert.equal(created.response.status, 201);
  assert.equal(db.rows[0].edit_token_hash, null);

  const attemptedClaim = await call(db, "POST", { ...baseMessage, editToken: ownerToken });
  assert.equal(attemptedClaim.response.status, 201);
  assert.equal(db.rows[0].edit_token_hash, null);

  const edit = await call(db, "PATCH", {
    clientId: baseMessage.clientId,
    editToken: ownerToken,
    text: "nedrīkst mainīties"
  });
  assert.equal(edit.response.status, 403);
  assert.equal(db.rows[0].body, baseMessage.text);
});
