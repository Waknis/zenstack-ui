# zenstack-ui

Customizable react components for zenstack and prisma. For now, forms (create/update) and lists (normal/infinite scroll/paginated) are supported.


### Forms
Automatically generate form components based on your zmodel schema. With a single component, input fields that match the field types in your zmodel are generated with default values, validation rules, keyboard shortcuts, and more. You can create an element map to customize which UI element is used for each field type.

[Read the docs to learn more](https://kirankunigiri.notion.site/zenstack-ui-docs-13be451fa71180c7b446ea03eb6e02f6)

[Test the demo website](https://zenstack-ui-demo.kirankunigiri.com)

![Zenstack UI Example](https://i.imgur.com/XwkhmDe.png)

This demo also serves as a great starter template for working with the following stack: react + zenstack + cloudflare workers. [Read docs for setting up the demo project yourself here](https://kirankunigiri.notion.site/Demo-Setup-13ce451fa71180378d97db65566cf357). zenstack-ui is headless, but the demo project uses Mantine as an example for how to integrate it with your favorite UI react component library.

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
<ZSCreateForm model={modelNames.item} />

// Update form (for example, you would pass an id from a page parameter)
<ZSUpdateForm model={modelNames.item} id={0} />
```

If you want to customize your forms, you can use slot placeholders or custom elements. This allows you to build complete templates with your own components. See the example below:
```tsx
<ZSUpdateForm model={modelNames.room} id={id}>
	{/* A placeholder example. This gets replaced by an input component */}
	<ZSFieldSlot className="grow" fieldName={roomFields.description} />

	{/* A custom element example. This will be directly used by the form */}
	<ZSCustomField fieldName={roomFields.aiSummary}>
		<Textarea
			className="grow"
			autosize
			label="AI Summary"
			placeholder="AI Summary"
		/>
	</ZSCustomField>
</ZSUpdateForm>
```

You can see the results in the demo! There are many customization options as well, read the docs to learn more.

### Lists

Generate type-safe lists with custom prisma queries. Loading states are automatically handled. Easily switch between normal/infinite scroll/paginated modes. See [`list.tsx`](https://github.com/kirankunigiri/zenstack-ui/blob/main/package/src/list/list.tsx) for an example implementation.

```tsx
<ZSList<PersonPayload>
    mode="normal" // change modes with "pagination" or "infinite"
    model={modelNames.person}
    query={personQuery} // optional! pass in typed prisma queries
    skeleton={<ListSkeleton />} // an optional loading skeleton
    render={person => ( // this object is type-safe based on your model or query
        <p className="list-item">{person.name}</p>
    )}
/>
```

You can try all 3 list modes in [this demo page](https://zenstack-ui-demo.kirankunigiri.com/list).