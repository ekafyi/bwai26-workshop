# Part II (Finished App)

## Directory Structure

```bash
.
├── skills
│   └── destination-picker/SKILL.md
├── .env
├── agent.ts
├── mock-data.ts
├── package.json
└── tools.ts
```

## Commands

```sh
# Store to DB
npx adk web --session_service_uri "sqlite://./traivel.db"

# Execute Runner as standalone script
npx tsx --env-file=.env runner.ts
```

### Workaround `adk-devtools@1.0.0`

⚠️ `adk-devtools@1.0.0` has a bug in build.
Run this symlink as temporary workaround.

```bash
ln -s esm/browser node_modules/@google/adk-devtools/dist/browser
```
