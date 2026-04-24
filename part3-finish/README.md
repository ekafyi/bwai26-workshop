# Part III (Finished App)

## Commands

```sh
npm run dev
# and all other Next.js commands...
```

### Workaround `adk-devtools@1.0.0`

⚠️ `adk-devtools@1.0.0` has a bug in build.
Run this symlink as temporary workaround.

```bash
ln -s esm/browser node_modules/@google/adk-devtools/dist/browser
```
