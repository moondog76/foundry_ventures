# Brand assets

The delivered Foundry SVG masters belong here, copied **byte-for-byte**:

```
foundry-logo-blue.svg
foundry-logo-white.svg
foundry-logo-black.svg
foundry-icon-blue.svg
foundry-icon-white.svg
```

They are not in this repository — the source archive lives with the design owner.

Never edit their path data, proportions or wordmark, and never recreate the logotype
with text or recolour it with a CSS filter. `foundry-logo-black.svg` deliberately uses
`#1f1f1f` rather than absolute black; keep it.

After copying, verify each file against the Appendix A.1 manifest:

```bash
pnpm brand:verify          # reports missing/mismatched files
pnpm brand:verify:strict   # fails when any file is missing (production gate)
```

Until they are present, `FoundryLogo` renders a clearly marked missing-asset frame and
the production gate fails. `bright.svg` from the source archive stays in
`content-quarantine/` until Bright is confirmed as a current portfolio company.
