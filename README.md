# Sales Management Backend

A REST API built with Fastify, Prisma, and PostgreSQL for managing sales, inventory, and client relationships.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   - Copy `.env.example` to `.env`
   - Update `DATABASE_URL` with your PostgreSQL connection string
   - Set `JWT_SECRET` to a secure random string

3. **Set up database**
   ```bash
   # Create migrations and apply to database
   npm run db:migrate
   
   # Seed with sample data
   npm run db:seed
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

The server will start on port 3333 (configurable via `PORT` env var).

## API Routes

- `POST /auth/register` - Register a new company and owner
- `POST /auth/login` - Login and get JWT token
- `GET /auth/me` - Get current user info
- `POST /auth/invite` - Invite new users to company

- `GET /clients` - List all clients
- `POST /clients` - Create new client
- `GET /clients/:id` - Get client details
- `GET /clients/:id/credit` - Get client credit info
- `PUT /clients/:id` - Update client
- `DELETE /clients/:id` - Delete client

- `GET /products` - List products (supports categoryId and search filters)
- `POST /products` - Create new product
- `GET /products/:id` - Get product details
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product

- `GET /categories` - List categories
- `POST /categories` - Create new category
- `PUT /categories/:id` - Update category
- `DELETE /categories/:id` - Delete category

- `GET /sales` - List sales (supports status, clientId, search filters)
- `POST /sales` - Create new sale
- `GET /sales/:id` - Get sale details
- `POST /sales/:id/payments` - Add payment to sale

- `GET /stock` - List stock entries (supports ownerId filter)
- `POST /stock/load` - Load stock to deposit
- `POST /stock/transfer` - Transfer stock between owners

- `GET /activities` - List activities (supports type and limit filters)

- `GET /dashboard/summary` - Get dashboard metrics

## Testing

Use curl or a REST client to test endpoints:

```bash
# Register
curl -X POST http://localhost:3333/auth/register \
  -H "Content-Type: application/json" \
  -d '{"companyName":"Test","ownerName":"Owner","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3333/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# List clients (requires Authorization header)
curl -X GET http://localhost:3333/clients \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

## Notes

- All resources are scoped to the authenticated user's company
- Stock management uses "DEPOSIT" as a sentinel value for depot stock
- Sale status (PAID/PARTIAL/UNPAID) is computed on payment updates
- Activity log is auto-generated for all major operations
