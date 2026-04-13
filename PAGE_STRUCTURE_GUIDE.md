# Page Structure Guide — System Prompt Supplement

This document is the authoritative reference for page header architecture across this project. Any new module, page, or AI-assisted generation **must** strictly follow this specification.

---

## 1. Component Blueprint

Every page must open with this header structure:

```tsx
<div className={styles.pageHeader}>
  <div className={styles.headerContent}>
    {/* LEFT SLOT — icon + title */}
    <div className={styles.headerLeft}>
      <SomeIcon className={styles.headerIcon} />
      <div>
        <h1 className={styles.pageTitle}>{t('pageTitle')}</h1>
        {/* Optional subtitle: */}
        {/* <p className={styles.pageSubtitle}>{t('subtitle')}</p> */}
      </div>
    </div>

    {/* RIGHT SLOT — primary action (omit if not applicable) */}
    <Button
      type="primary"
      size="large"
      icon={<PlusOutlined />}
      className={styles.addButton}
      onClick={handleAdd}
      loading={isCreating}
    >
      {t('addItem')}
    </Button>
  </div>
</div>
```

### HR Module variant

HR pages use the shared `HRPageHeader` component instead of inline JSX:

```tsx
import HRPageHeader from '@/features/hr/components/HRPageHeader';

<HRPageHeader
  title={isAr ? 'العنوان بالعربي' : 'Page Title'}
  icon={<SomeIcon />}
  actions={[
    {
      key: 'add',
      label: isAr ? 'إضافة' : 'Add',
      icon: <PlusOutlined />,
      onClick: handleAdd,
      loading: isCreating,
    },
  ]}
/>
```

---

## 2. CSS Standard

Add these classes to the page's own `.module.css` file. Values must match exactly.

```css
/* Page Header */
.pageHeader {
  background: linear-gradient(135deg, #003366 0%, #00478c 100%);
  border-radius: 12px;
  padding: 32px;
  margin-bottom: 24px;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 51, 102, 0.15);
}

.headerContent {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.headerLeft {
  display: flex;
  align-items: center;
  gap: 20px;
}

.headerIcon {
  font-size: 48px;
  color: #00aa64;
}

.pageTitle {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  color: #ffffff;
}

/* Optional subtitle */
.pageSubtitle {
  margin: 8px 0 0 0;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.85);
}

/* Primary action button */
.addButton {
  height: 48px;
  padding: 0 32px;
  font-size: 16px;
  font-weight: 600;
  background: #00aa64;
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 170, 100, 0.3);
  transition: all 0.3s ease;
}

.addButton:hover {
  background: #00b478 !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 170, 100, 0.4) !important;
}

/* RTL Support */
[dir='rtl'] .headerLeft {
  flex-direction: row-reverse;
}

/* Responsive */
@media (max-width: 768px) {
  .pageHeader {
    padding: 24px 20px;
  }

  .headerContent {
    flex-direction: column;
    align-items: stretch;
  }

  .headerLeft {
    gap: 16px;
  }

  .headerIcon {
    font-size: 36px;
  }

  .pageTitle {
    font-size: 24px;
  }

  .addButton {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .pageHeader {
    padding: 20px 16px;
  }

  .headerIcon {
    font-size: 32px;
  }

  .pageTitle {
    font-size: 20px;
  }

  .addButton {
    height: 44px;
    font-size: 15px;
  }
}
```

---

## 3. Slot Definitions

| Slot | Element | Class | Required |
|------|---------|-------|----------|
| Page wrapper | `<div>` | `styles.pageHeader` | ✅ |
| Flex row | `<div>` | `styles.headerContent` | ✅ |
| Left side | `<div>` | `styles.headerLeft` | ✅ |
| Page icon | Ant Design Icon component | `styles.headerIcon` | ✅ |
| Page title | `<h1>` | `styles.pageTitle` | ✅ |
| Subtitle | `<p>` | `styles.pageSubtitle` | Optional |
| Primary action | `<Button type="primary" size="large">` | `styles.addButton` | Optional |

### Rules
- **Icon**: Use a relevant Ant Design icon. Apply `className={styles.headerIcon}` — never use inline `style={{ fontSize, color }}`.
- **Title**: Always `<h1>` with `className={styles.pageTitle}`. No inline styles.
- **Button**: If the page has a primary create/add action, place it in the right slot with `className={styles.addButton}`. Remove any inline `style` that duplicates the CSS.
- **No extra wrappers**: Do not add additional divs between `headerLeft` and the icon/title beyond what is shown in the blueprint.

---

## 4. Context Rules for AI Generation

When generating or modifying any page in this project, follow these rules without exception:

1. **The outer wrapper class is always `styles.pageHeader`** — never `styles.header`, `styles.headerWrapper`, or any other variant.

2. **The title element is always `<h1 className={styles.pageTitle}>`** — never `styles.title`, `styles.heading`, or a `<Typography.Title>` component.

3. **Icons receive `className={styles.headerIcon}`** — never inline `style={{ fontSize: '...', color: '...' }}` on header icons.

4. **Buttons use `className={styles.addButton}`** — never inline `style={{ background: '#00aa64', ... }}` on the primary action button.

5. **CSS class names are module-scoped** — each page has its own `.module.css` file. Copy the standard CSS block above into that file. Do not reference cross-module classes.

6. **HR pages use `HRPageHeader`** — pages under `src/app/hr/**` use the shared `HRPageHeader` component from `@/features/hr/components/HRPageHeader`. Do not duplicate inline header JSX for HR pages.

7. **Skip `more/` directory** — pages under `src/app/more/**` are excluded from header standardization.

8. **Reference file**: `src/app/branch/management/page.tsx` + `src/app/branch/management/Branch.module.css` are the canonical source of truth. When in doubt, match them exactly.
