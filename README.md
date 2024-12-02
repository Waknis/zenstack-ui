# zenstack-ui

Customizable react components for zenstack and prisma (forms/lists/etc.)

This library is a work in progress, and may not be ready for production yet.

Currently, you can use it to add form components that automatically generate based on your zmodel schema. With a single component, input fields that match the field types in your zmodel are generated with default values, validation rules, keyboard shortcuts, and more.

[Read the docs to learn more](https://kirankunigiri.notion.site/zenstack-ui-docs-13be451fa71180c7b446ea03eb6e02f6)

[Test the demo website](https://zenstack-ui-demo.kirankunigiri.com)

![Zenstack UI Example](https://i.imgur.com/XwkhmDe.png)

This demo also serves as a great starter template for working with the following stack: react + zenstack + cloudflare workers. [Read docs for setting up the demo project yourself here](https://kirankunigiri.notion.site/Demo-Setup-13ce451fa71180378d97db65566cf357).

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

This is all the code you need to generate the forms seen in the demo! Any change in the zmodel schema will automatically reflect in the UI. There are many customization options as well, including creating form templates and custom elements. Read the docs to learn more.

```tsx
// Create form
<ZSCreateForm model={modelNames.item} />

// Update form (for example, you would pass an id from a page parameter)
<ZSUpdateForm model={modelNames.item} id={0} />
```

You can see the results in the demo!
