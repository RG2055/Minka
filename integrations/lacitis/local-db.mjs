// Local-only D1 adapter for exercising the production account handler with SQLite.
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
export function localDb(filename=':memory:'){
 const sqlite=new DatabaseSync(filename);
 sqlite.exec(`CREATE TABLE IF NOT EXISTS dezura_workers(worker_id TEXT PRIMARY KEY,name TEXT NOT NULL,role TEXT,shift TEXT,last_shift_expires_at INTEGER,updated_at INTEGER);
 CREATE TABLE IF NOT EXISTS dezura_pins(worker_id TEXT PRIMARY KEY,pin_hash TEXT,pin_salt TEXT,iterations INTEGER,created_at INTEGER,updated_at INTEGER);
 CREATE TABLE IF NOT EXISTS dezura_libraries(worker_id TEXT PRIMARY KEY,data TEXT,updated_at INTEGER);`);
 sqlite.exec(fs.readFileSync(new URL('./schema.sql',import.meta.url),'utf8'));
 const db={sqlite,prepare(sql){let values=[];return {bind(...v){values=v;return this;},async first(){return sqlite.prepare(sql).get(...values)||null;},async all(){return {results:sqlite.prepare(sql).all(...values)};},async run(){const r=sqlite.prepare(sql).run(...values);return {meta:{changes:Number(r.changes)}};}};},async batch(statements){sqlite.exec('BEGIN');try{const results=[];for(const s of statements)results.push(await s.run());sqlite.exec('COMMIT');return results;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};
 return db;
}
