# CollabCanvas Design System

A modern, Material Design-inspired component library built with design tokens for consistency and maintainability.

## Table of Contents

- [Design Tokens](#design-tokens)
- [Components](#components)
  - [Card](#card)
  - [Input](#input)
  - [Button](#button)
  - [Toast Notifications](#toast-notifications)
- [Usage Examples](#usage-examples)

---

## Design Tokens

All components use centralized design tokens from `src/styles/tokens.js` for consistent styling.

### Colors

#### Primary (Blue)

- `primary.500`: #2196f3 - Main brand color
- `primary.600`: #1e88e5
- `primary.700`: #1976d2

#### Secondary (Purple)

- `secondary.500`: #9c27b0 - Accent color
- `secondary.600`: #8e24aa
- `secondary.700`: #7b1fa2

#### Semantic Colors

- **Success**: #4caf50 (green)
- **Error**: #f44336 (red)
- **Warning**: #ff9800 (orange)
- **Info**: #2196f3 (blue)

#### Neutral (Grays)

- `neutral.0`: #ffffff (white)
- `neutral.100`: #f5f5f5
- `neutral.300`: #e0e0e0
- `neutral.500`: #9e9e9e
- `neutral.700`: #616161
- `neutral.900`: #212121

### Typography

- **Font Family**: System fonts (-apple-system, Segoe UI, Roboto, etc.)
- **Font Sizes**: xs (12px), sm (14px), base (16px), lg (18px), xl (20px), 2xl (24px)
- **Font Weights**: light (300), regular (400), medium (500), semibold (600), bold (700)
- **Line Heights**: tight (1.25), normal (1.5), relaxed (1.625)

### Spacing Scale

- `spacing.1`: 4px
- `spacing.2`: 8px
- `spacing.3`: 12px
- `spacing.4`: 16px
- `spacing.6`: 24px
- `spacing.8`: 32px

### Border Radius

- `borderRadius.base`: 8px
- `borderRadius.md`: 12px
- `borderRadius.lg`: 16px
- `borderRadius.full`: 9999px (fully rounded)

### Shadows

Material Design elevation system with 12 levels (0-24):

- `shadows.elevation.2`: Subtle card elevation
- `shadows.elevation.4`: Hover state
- `shadows.elevation.8`: Modal/dialog

---

## Components

### Card

A versatile container component for grouping related content.

#### Props

| Prop        | Type                                 | Default      | Description                         |
| ----------- | ------------------------------------ | ------------ | ----------------------------------- |
| `variant`   | `'elevated' \| 'outlined' \| 'flat'` | `'elevated'` | Visual style variant                |
| `padding`   | `'none' \| 'sm' \| 'md' \| 'lg'`     | `'md'`       | Internal padding size               |
| `hover`     | `boolean`                            | `false`      | Enable hover effect (lift & shadow) |
| `className` | `string`                             | `''`         | Additional CSS classes              |
| `style`     | `object`                             | `{}`         | Custom inline styles                |

#### Examples

```jsx
import Card from './components/design-system/Card';

// Elevated card (default)
<Card>
  <h2>Welcome</h2>
  <p>This is a card with elevation shadow.</p>
</Card>

// Outlined card with large padding
<Card variant="outlined" padding="lg">
  <h2>Outlined Style</h2>
</Card>

// Flat card with hover effect
<Card variant="flat" hover>
  <p>Hover over me!</p>
</Card>
```

---

### Input

A fully-featured input component with validation states and password toggle.

#### Props

| Prop           | Type                                                                        | Default      | Description                           |
| -------------- | --------------------------------------------------------------------------- | ------------ | ------------------------------------- |
| `label`        | `string`                                                                    | -            | Label text above input                |
| `type`         | `'text' \| 'email' \| 'password' \| 'number' \| 'tel' \| 'url' \| 'search'` | `'text'`     | Input type                            |
| `value`        | `string`                                                                    | **required** | Input value (controlled)              |
| `onChange`     | `function`                                                                  | **required** | Change handler                        |
| `error`        | `string`                                                                    | `''`         | Error message (applies error styling) |
| `success`      | `boolean`                                                                   | `false`      | Apply success styling                 |
| `helperText`   | `string`                                                                    | `''`         | Helper text below input               |
| `placeholder`  | `string`                                                                    | `''`         | Placeholder text                      |
| `disabled`     | `boolean`                                                                   | `false`      | Disable input                         |
| `required`     | `boolean`                                                                   | `false`      | Mark as required (shows \*)           |
| `name`         | `string`                                                                    | -            | Input name attribute                  |
| `autoComplete` | `string`                                                                    | -            | Autocomplete attribute                |

#### Examples

```jsx
import Input from './components/design-system/Input';

// Basic input
<Input
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  placeholder="you@example.com"
/>

// Input with error
<Input
  label="Password"
  type="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  error="Password must be at least 8 characters"
  required
/>

// Input with success and helper text
<Input
  label="Username"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
  success
  helperText="Username is available"
/>

// Password input (auto includes visibility toggle)
<Input
  label="Password"
  type="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  autoComplete="current-password"
/>
```

---

### Button

A versatile button component with multiple variants, sizes, and states.

#### Props

| Prop        | Type                                               | Default     | Description                  |
| ----------- | -------------------------------------------------- | ----------- | ---------------------------- |
| `variant`   | `'primary' \| 'secondary' \| 'outline' \| 'ghost'` | `'primary'` | Visual variant               |
| `size`      | `'sm' \| 'md' \| 'lg'`                             | `'md'`      | Button size                  |
| `loading`   | `boolean`                                          | `false`     | Show loading spinner         |
| `disabled`  | `boolean`                                          | `false`     | Disable button               |
| `fullWidth` | `boolean`                                          | `false`     | Full width button            |
| `type`      | `'button' \| 'submit' \| 'reset'`                  | `'button'`  | Button type                  |
| `onClick`   | `function`                                         | -           | Click handler                |
| `ariaLabel` | `string`                                           | -           | ARIA label for accessibility |

#### Examples

```jsx
import Button from './components/design-system/Button';

// Primary button
<Button variant="primary" onClick={handleSubmit}>
  Sign In
</Button>

// Secondary button
<Button variant="secondary" size="lg">
  Learn More
</Button>

// Outline button
<Button variant="outline">
  Cancel
</Button>

// Ghost button (subtle)
<Button variant="ghost" size="sm">
  Skip
</Button>

// Loading state
<Button variant="primary" loading disabled>
  Loading...
</Button>

// Full width button
<Button variant="primary" fullWidth type="submit">
  Create Account
</Button>
```

---

### Toast Notifications

Toast notifications powered by `react-hot-toast` with custom styling.

#### Functions

| Function                         | Parameters        | Description                 |
| -------------------------------- | ----------------- | --------------------------- |
| `showSuccess(message, options?)` | `message: string` | Show success toast (green)  |
| `showError(message, options?)`   | `message: string` | Show error toast (red)      |
| `showWarning(message, options?)` | `message: string` | Show warning toast (orange) |
| `showInfo(message, options?)`    | `message: string` | Show info toast (blue)      |
| `showLoading(message, options?)` | `message: string` | Show loading toast          |
| `dismissToast(toastId)`          | `toastId: string` | Dismiss specific toast      |
| `dismissAll()`                   | -                 | Dismiss all toasts          |

#### Setup

Add the Toaster component to your App.jsx:

```jsx
import { Toaster } from "react-hot-toast";
import { toastConfig } from "./utils/toast";

function App() {
  return (
    <>
      <Toaster {...toastConfig} />
      {/* Your app content */}
    </>
  );
}
```

#### Examples

```jsx
import { showSuccess, showError, showWarning, showInfo } from "./utils/toast";

// Success notification
showSuccess("Login successful!");

// Error notification
showError("Invalid credentials");

// Warning notification
showWarning("Connection unstable");

// Info notification
showInfo("New update available");

// Loading notification (returns ID to dismiss later)
const loadingToastId = showLoading("Saving changes...");
// Later...
dismissToast(loadingToastId);
showSuccess("Changes saved!");
```

---

## Usage Examples

### Login Form Example

```jsx
import { useState } from "react";
import Card from "./components/design-system/Card";
import Input from "./components/design-system/Input";
import Button from "./components/design-system/Button";
import { showSuccess, showError } from "./utils/toast";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
      showSuccess("Welcome back!");
    } catch (error) {
      showError("Invalid credentials");
      setErrors({ password: "Incorrect password" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card variant="elevated" padding="lg">
      <h2 style={{ marginBottom: "24px" }}>Sign In</h2>

      <form onSubmit={handleSubmit}>
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          required
        />

        <Button variant="primary" type="submit" fullWidth loading={loading}>
          Sign In
        </Button>
      </form>
    </Card>
  );
}
```

### Form Validation Example

```jsx
<Input
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={emailError}
  helperText={!emailError && "We'll never share your email"}
  required
/>

<Input
  label="Password"
  type="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  success={passwordValid}
  helperText={passwordValid ? "Strong password!" : "At least 8 characters"}
  required
/>
```

### Button Variants Example

```jsx
<div style={{ display: "flex", gap: "16px" }}>
  <Button variant="primary">Primary</Button>
  <Button variant="secondary">Secondary</Button>
  <Button variant="outline">Outline</Button>
  <Button variant="ghost">Ghost</Button>
</div>
```

---

## Best Practices

1. **Always use design tokens** instead of hardcoded values
2. **Use semantic color names** (success, error, warning, info) for clarity
3. **Provide proper labels** for all inputs (accessibility)
4. **Use loading states** to provide feedback during async operations
5. **Show validation errors** immediately for better UX
6. **Use toast notifications** for system-level feedback
7. **Keep button text concise** and action-oriented
8. **Test keyboard navigation** for all interactive elements

---

## Accessibility

All components follow WAI-ARIA guidelines:

- ✅ **Keyboard Navigation**: All interactive elements are keyboard accessible
- ✅ **ARIA Labels**: Proper labels for screen readers
- ✅ **Focus States**: Clear focus indicators
- ✅ **Color Contrast**: WCAG AA compliant color combinations
- ✅ **Semantic HTML**: Proper use of semantic elements

---

## Future Enhancements

- Select/Dropdown component
- Checkbox and Radio components
- Modal/Dialog component
- Tooltip component
- DatePicker component
- File Upload component
- Progress indicators
- Dark mode support

---

## Support

For issues or questions, please refer to the main project README or create an issue in the repository.
