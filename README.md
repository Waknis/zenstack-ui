# zenstack-ui

Customizable react components for zenstack and prisma (forms/lists/etc.)

This library is a work in progress, and may not be ready for production yet. Many new features are coming soon.

Currently, you can use it to add form components that automatically generate based on your zmodel schema. With a single component, input fields that match the field types in your zmodel are generated with default values, validation rules, keyboard shortcuts, and more.

[Read the docs to learn more](https://kirankunigiri.notion.site/zenstack-ui-docs-13be451fa71180c7b446ea03eb6e02f6)

[Test the demo website](https://zenstack-ui-demo.kirankunigiri.com)

Here's an example from the demo. After running zenstack generation, you can pass the model name (ex: "Item") to any ZenstackForm component to create a fully functional form.

```prisma
model Item {
	id        Int           @id @default(autoincrement())
	// generates text input
	name      String
	// generates select input with enum values
	category  ITEM_CATEGORY
	// generates relation picker populated with Person records
	owner     Person        @relation(fields: [ownerName], references: [name])
	ownerName String
}
```

This is all the code you need to generate the forms seen in the demo! Any change in the zmodel schema will automatically reflect in the UI.

```tsx
// Create form
<ZenstackCreateForm model="Item" />

// Update form (for example, you would pass an id from a page parameter)
<ZenstackUpdateForm model="Item" id={0} />
```

You can see the results in the demo!
