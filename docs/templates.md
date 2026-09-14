# Sample configs in templates/

`templates/.env` holds real local values and is never committed.
`templates/.env.example` is the blank template. Setup from the repository root:

```sh
cp templates/.env.example templates/.env
```

Local workflow (run from the repository root):

```sh
make up        # start (database only until app code exists)
make up-app    # full stack once backend/app and frontend/app have a Dockerfile
make down      # stop
make logs SERVICE=db
make seed      # re-import database/Web_DataBase_USTH.sql
make validate  # check all 15 expected tables exist
```
