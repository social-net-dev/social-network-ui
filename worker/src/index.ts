import { Hono } from 'hono'
import { Scalar } from '@scalar/hono-api-reference'
import { swaggerUI } from '@hono/swagger-ui'

const app = new Hono()

// Use the middleware to serve the Scalar API Reference at /scalar
app.get('/', swaggerUI({ url: '/openapi.json' }))
app.get('/scalar', Scalar({ url: '/openapi.json' }))

export default app