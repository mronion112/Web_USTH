# Lunara Spa Service

Standalone Spring Boot application implementing the Spa Service feature described in `Guide.md`.
It can be built, tested and run independently from the other backend feature folders.

## Requirements

- Java 21 or newer
- MySQL 8.4
- No global Maven installation is required; use Maven Wrapper.

## Environment variables

The application reads the following variables and falls back to local development defaults:

```text
BACKEND_PORT=8080
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/lunara_spa?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
SPRING_DATASOURCE_USERNAME=lunara
SPRING_DATASOURCE_PASSWORD=change-me-app
FRONTEND_URL=http://localhost:5173
```

Initialize MySQL with `../../database/Web_DataBase_USTH.sql` before starting the application.

## Commands

On Windows:

```powershell
.\mvnw.cmd clean test
.\mvnw.cmd spring-boot:run
```

On macOS/Linux:

```bash
./mvnw clean test
./mvnw spring-boot:run
```

## API endpoints

- `GET /api/services` lists active services.
- `GET /api/services/{id}` returns one active service and its eligible staff.
- `POST /api/manager/services` creates a service and returns `201 Created`.

All endpoints return the common response shape required by the project:

```json
{
  "success": true,
  "message": "Success",
  "data": {},
  "timestamp": "2026-09-20T10:00:00Z"
}
```

Errors use the same shape with `success: false` and `data: null`. Request examples are in
`spa-service.http`.

## Integration note

The manager endpoint is not protected yet because the Authentication feature has not been
integrated. Do not expose this development build publicly. JWT and permission checks must be
added when the Authentication feature is available.
