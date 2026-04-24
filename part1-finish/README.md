# Part I (Finished App)

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
# run `agent.ts` in CLI
npx adk run agent.ts

# run web UI
npx adk web

# scaffold new agent called `my_agent` in CLI
npx adk create agent my_agent
```

### Workaround `adk-devtools@1.0.0`

⚠️ `adk-devtools@1.0.0` has a bug in build.
Run this symlink as temporary workaround.

```bash
ln -s esm/browser node_modules/@google/adk-devtools/dist/browser
```
