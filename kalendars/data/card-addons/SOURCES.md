# Card add-on production assets

The local review folders (intentionally excluded from the production deploy)
contain unscaled transparent PNG crops from the original full-resolution RGBA
sheets supplied by the project owner on 2026-08-30.

- `review-original/`: source `codex-clipboard-2aa6d48d-7c55-49a8-883d-b4f82fa1c31c.png`.
  Six source-sheet headings and ten owner-rejected assets are excluded. The
  remaining filenames intentionally keep their review numbers, including gaps,
  so later feedback cannot accidentally point at a different object.
- `review-medical/`: source `codex-clipboard-854fd157-defb-44b2-a04b-594177283acc.png`.
  This set is not curated yet.
- `optimized/`: the 54 production assets exposed by the card-decor picker.
  This includes the previously approved assets, five standalone toppers and
  five additional standalone decorations supplied on 2026-08-31. Every file
  is alpha-trimmed with a transparent safety
  margin, resized only to the maximum resolution useful in the card UI and
  encoded as transparent WebP. The production set is 1.90 MiB instead of
  27.29 MiB (93.0% smaller).

Segmentation uses the alpha channel (`alpha > 3`), connected components and
automatic high-alpha core seeds to separate neighbouring objects joined only by
soft glow. It does not use predefined coordinates, grid cells, AI background
removal, redrawing, or resizing. Crops preserve original RGBA pixels and add
12 px of transparent safety padding.

The opaque checkerboard preview `codex-clipboard-58eca9d4-d1ee-4cef-980c-888d0600ff26.png`
was rejected as a segmentation source because its alpha channel is fully opaque.
Only the owner-approved assets in `optimized/` are exposed in the local
card-decor picker. The uncurated medical sheet remains outside the picker.
The original large standalone PNG copies were replaced by the optimized WebP
files after visual and alpha validation.
