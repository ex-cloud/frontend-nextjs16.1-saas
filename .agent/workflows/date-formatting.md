---
description: Date formatting standards for consistent human-readable dates
---

# Date Formatting Workflow

This workflow documents the date formatting standards used across the project to ensure consistent, human-readable date displays.

## Backend (Laravel)

### FormatsDatesTrait

Location: `app/Traits/FormatsDatesTrait.php`

**Available Methods:**

| Method | Output Format | Example | Use Case |
|--------|--------------|---------|----------|
| `formatDate($date)` | "M j, Y" | "Jan 11, 2026" | Display dates (date only) |
| `formatDateTime($date)` | "M j, Y, g:i A" | "Jan 11, 2026, 3:23 PM" | Timestamps |
| `formatIsoDateTime($date)` | ISO 8601 | "2026-01-11T15:23:00.000000Z" | Precise timestamps, audit logs |
| `formatApiDate($date)` | "Y-m-d" | "2026-01-11" | Date picker fields, forms |

**Usage in Resources:**

```php
use App\Traits\FormatsDatesTrait;

class UserResource extends JsonResource
{
    use FormatsDatesTrait;

    public function toArray(Request $request): array
    {
        return [
            // For timestamp fields:
            'created_at' => $this->formatDateTime($this->created_at),
            'updated_at' => $this->formatDateTime($this->updated_at),
            
            // For date-only fields used in forms:
            'join_date' => $this->formatApiDate($this->join_date),
            'birth_date' => $this->formatApiDate($this->birth_date),
        ];
    }
}
```

---

## Frontend (Next.js/TypeScript)

### format-date.ts

Location: `lib/utils/format-date.ts`

**Available Functions:**

| Function | Description | Example Output |
|----------|-------------|----------------|
| `formatDate(date)` | Format to date only | "Jan 11, 2026" |
| `formatDateTime(date)` | Format with time | "Jan 11, 2026, 3:23 PM" |
| `formatDateValue(value)` | Auto-detect ISO and format | "Jan 11, 2026, 3:23 PM" or original value |
| `isIsoDateString(value)` | Check if string is ISO date | `true` / `false` |

**Usage in Components:**

```tsx
import { formatDateValue, formatDateTime } from "@/lib/utils/format-date";

// For audit logs, activity history - auto-detect and format:
<TableCell>{formatDateValue(row.newValue)}</TableCell>

// For known date fields:
<span>{formatDateTime(user.created_at)}</span>
```

---

## Best Practices

1. **Backend Resources**: Use `formatDateTime()` for timestamps, `formatApiDate()` for form fields
2. **Frontend Display**: Use `formatDateValue()` for values that might be dates (auto-detects ISO strings)
3. **Consistency**: All 10 Resources in the project now use `FormatsDatesTrait`
4. **Testing**: Run unit tests after changes to date formatting

## Running Tests

```bash
# Backend (Laravel)
php artisan test tests/Unit/Traits/FormatsDateTraitTest.php

# Frontend (Vitest)
pnpm test lib/utils/__tests__/format-date.test.ts
```
