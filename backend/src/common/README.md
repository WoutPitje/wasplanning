# Common Module

This module contains shared utilities, DTOs, and interfaces used across the entire application.

## Overview

The common module provides reusable components that are not specific to any particular domain but are needed throughout the application.

## Structure

```
common/
├── dto/
│   ├── pagination.dto.ts    # Pagination query parameters
│   └── sort.dto.ts          # Sorting query parameters
└── interfaces/
    └── paginated-response.interface.ts  # Standardized pagination response format
```

## Components

### DTOs (Data Transfer Objects)

#### PaginationDto
Standardizes pagination query parameters across all endpoints:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)

#### SortDto
Provides sorting capabilities:
- `sort` - Field to sort by
- `order` - Sort direction ('asc' or 'desc')

### Interfaces

#### PaginatedResponseInterface
Standardizes paginated API responses:
```typescript
{
  data: T[],
  meta: {
    total: number,
    page: number,
    limit: number,
    totalPages: number
  }
}
```

## Usage

### Pagination
```typescript
@Get()
async findAll(@Query() paginationDto: PaginationDto) {
  return this.service.findAll(paginationDto);
}
```

### Sorting
```typescript
@Get()
async findAll(@Query() sortDto: SortDto) {
  return this.service.findAll(sortDto);
}
```

### Combined Usage
```typescript
@Get()
async findAll(
  @Query() paginationDto: PaginationDto,
  @Query() sortDto: SortDto
) {
  return this.service.findAll({ ...paginationDto, ...sortDto });
}
```

## Best Practices

1. **Consistent Pagination**: Always use PaginationDto for paginated endpoints
2. **Response Format**: Use PaginatedResponseInterface for consistent API responses
3. **Validation**: DTOs include validation decorators for parameter validation
4. **Documentation**: All DTOs are documented with Swagger decorators

## Dependencies

- `class-validator` - For DTO validation
- `class-transformer` - For DTO transformation
- `@nestjs/swagger` - For API documentation