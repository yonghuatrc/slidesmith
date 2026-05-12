# Code Examples

A collection of code snippets.

---

## TypeScript

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }
  return response.json();
}
```

---

## Python

```python
from typing import Optional
import asyncio

class DataProcessor:
    def __init__(self, config: dict):
        self.config = config
        self.data: list = []

    async def process(self, items: list) -> list[dict]:
        tasks = [self._process_item(item) for item in items]
        return await asyncio.gather(*tasks)

    async def _process_item(self, item) -> dict:
        # Process individual item
        return {'result': item * 2}
```

---

## Rust

```rust
use std::collections::HashMap;

#[derive(Debug)]
struct Config {
    host: String,
    port: u16,
    workers: usize,
}

impl Config {
    fn from_env() -> Result<Self, ConfigError> {
        let host = std::env::var("HOST").unwrap_or("localhost".into());
        let port = std::env::var("PORT")
            .ok()
            .and_then(|p| p.parse().ok())
            .unwrap_or(8080);
        Ok(Config { host, port, workers: 4 })
    }
}
```

NOTE: Rust's type system catches many errors at compile time.

---

## SQL

```sql
WITH revenue AS (
    SELECT
        department,
        SUM(amount) as total_revenue,
        COUNT(*) as transaction_count
    FROM transactions
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY department
)
SELECT
    department,
    total_revenue,
    transaction_count,
    total_revenue / transaction_count as avg_transaction
FROM revenue
ORDER BY total_revenue DESC;
```
