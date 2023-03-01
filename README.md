# prisma-to-python

Parse prisma.schema files and output enums, types and models as Python classes

> ⚠️ This only supports a subset of the prisma schema syntax - feel free to contribute any other features you need!

This was built to set up models for use with [pymongo](https://pypi.org/project/pymongo), but could be applicable to other use cases.

prisma-to-python works by using the `getDMMF` function of [@prisma/internals](https://www.npmjs.com/package/@prisma/internals), which effectively parses the schema to an AST in JSON. This AST is then used to write Python code for the defined enums, types and models.

## Usage

```bash
npx prisma-to-python --input ./example/schema.prisma --output ./example/models.py
```

## Example

### Input

```prisma
// https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

enum FruitName {
  apple
  banana
  orange
}

type Fruit {
  fruit       FruitName
  price       Int
  description String?
  dateSold    DateTime
  received    Boolean
}

model FruitOrders {
  id    String  @id @default(auto()) @map("_id") @db.ObjectId
  fruit Fruit[]
}
```

### Output

```python
# Generated by prisma-py-generator - https://github.com/jmsv/prisma-to-python#readme
# Do not edit this file directly!

from enum import Enum
from typing import TypedDict, Optional
from datetime import datetime

# Enums

class FruitName(Enum):
    APPLE = "apple"
    BANANA = "banana"
    ORANGE = "orange"

# Types

class Fruit(TypedDict):
    fruit: FruitName
    price: int
    description: Optional[str]
    dateSold: datetime
    received: bool

# Models

class FruitOrders(TypedDict):
    _id: str
    fruit: list[Fruit]
```
