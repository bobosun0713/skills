# Testing Vue Components

**Impact: High** — Component tests are the most common test type; knowing Vue Test Utils well is essential.

## Basic Mounting

```typescript
import { mount, shallowMount } from '@vue/test-utils'
import MyComponent from '@/components/MyComponent.vue'

// mount: renders full component tree
// shallowMount: stubs all child components (good for isolation)
const wrapper = mount(MyComponent)
```

## Passing Props

```typescript
const wrapper = mount(UserCard, {
  props: {
    name: 'Alice',
    age: 30,
    isAdmin: true,
  }
})

expect(wrapper.find('[data-testid="name"]').text()).toBe('Alice')
```

## Testing Emits

```typescript
it('should emit confirm event when confirm button is clicked', async () => {
  const wrapper = mount(ConfirmDialog)
  await wrapper.find('[data-testid="confirm-btn"]').trigger('click')

  expect(wrapper.emitted('confirm')).toBeTruthy()
  expect(wrapper.emitted('confirm')?.[0]).toEqual([{ confirmed: true }])
})
```

## Testing v-model

```typescript
it('should emit update:modelValue after input', async () => {
  const wrapper = mount(TextInput, {
    props: { modelValue: '' }
  })

  await wrapper.find('input').setValue('Hello')

  expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['Hello'])
})
```

## Testing Slots

```typescript
it('should render slot content', () => {
  const wrapper = mount(Card, {
    slots: {
      default: '<p data-testid="slot-content">Slot Text</p>',
      header: '<h1>Title</h1>',
    }
  })

  expect(wrapper.find('[data-testid="slot-content"]').exists()).toBe(true)
})
```

## Providing Global Dependencies (provide/inject)

```typescript
const wrapper = mount(ChildComponent, {
  global: {
    provide: {
      theme: 'dark',
      userId: 42,
    }
  }
})
```

## Stubbing Child Components

```typescript
const wrapper = mount(ParentComponent, {
  global: {
    stubs: {
      // stub a specific child component to prevent side effects
      'ChildComponent': true,
      // or provide a fake implementation
      'RouterLink': { template: '<a><slot /></a>' },
    }
  }
})
```

## Querying DOM Elements

```typescript
wrapper.find('[data-testid="submit"]')     // single element
wrapper.findAll('[data-testid="item"]')    // multiple elements
wrapper.findComponent(ChildComponent)      // child component
wrapper.get('[data-testid="x"]')          // throws if not found (stricter than find)

// Common assertions
expect(el.exists()).toBe(true)
expect(el.isVisible()).toBe(true)
expect(el.text()).toBe('Hello')
expect(el.attributes('href')).toBe('/home')
expect(el.classes()).toContain('active')
```

## Testing Conditional Rendering (v-if / v-show)

```typescript
it('should not show Dashboard link when user is not logged in', () => {
  const wrapper = mount(NavBar, {
    props: { isLoggedIn: false }
  })
  expect(wrapper.find('[data-testid="dashboard-link"]').exists()).toBe(false)
})
```

## Re-testing After Props Update

```typescript
it('should re-render after props update', async () => {
  const wrapper = mount(Badge, { props: { count: 0 } })
  expect(wrapper.text()).toBe('0')

  await wrapper.setProps({ count: 5 })
  expect(wrapper.text()).toBe('5')
})
```

## Full Example: Form Component Test

```typescript
describe('LoginForm', () => {
  it('should show an error when fields are empty and form is submitted', async () => {
    const wrapper = mount(LoginForm)
    await wrapper.find('[data-testid="submit"]').trigger('click')
    expect(wrapper.find('[data-testid="error-msg"]').text()).toBe('Please fill in all fields')
  })

  it('should emit submit event with form data when fields are valid', async () => {
    const wrapper = mount(LoginForm)
    await wrapper.find('[data-testid="email"]').setValue('user@example.com')
    await wrapper.find('[data-testid="password"]').setValue('secret123')
    await wrapper.find('[data-testid="submit"]').trigger('click')
    await flushPromises()

    expect(wrapper.emitted('submit')?.[0]).toEqual([{
      email: 'user@example.com',
      password: 'secret123'
    }])
  })
})
```