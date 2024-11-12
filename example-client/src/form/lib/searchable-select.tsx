import { Select, type SelectProps, TextInput } from '@mantine/core';
import { useHover } from '@mantine/hooks';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { LuCheckCircle2, LuSearch } from 'react-icons/lu';

// TODO: Allow pasing in custom rendering function (for option or group header)
// TODO: Switch render function if isGroupHeader is true
// In the future, it's better to create a custom component from scratch using Combobox instead of Select

// Create context and its type
interface SearchableSelectContextType {
	searchText: string
	setSearchText: (text: string) => void
	enterPressed: boolean
	setEnterPressed: (pressed: boolean) => void
	dropdownOpened: boolean
	setDropdownOpened: (opened: boolean) => void
	filteredOptionCount: number
	setFilteredOptionCount: (count: number) => void
	selectedIndex: number
	setSelectedIndex: (index: number) => void
}
const SearchableSelectContext = createContext<SearchableSelectContextType | null>(null);

// --------------------------------------------------------------------------------
// Custom types to add number support to Combobox
// --------------------------------------------------------------------------------
type CustomComboboxItemValue = string | number;

export interface CustomComboboxItem {
	label: string
	value: CustomComboboxItemValue
	disabled?: boolean
}

interface CustomComboboxItemGroup<T = CustomComboboxItem | CustomComboboxItemValue> {
	group: string
	items: T[]
}

type SelectData = (CustomComboboxItemValue | CustomComboboxItem | CustomComboboxItemGroup<string | CustomComboboxItem>)[];

type CustomSelectProps = Omit<SelectProps, 'data'> & {
	data: SelectData
};

interface StandardizedSelectOption {
	label: string
	value: string
	index: number
	isGroupHeader: boolean
}

/** Transforms the select props input data to a custom format we use */
const transformData = (data: SelectData): StandardizedSelectOption[] => {
	return data.flatMap((item, index) => {
		if (typeof item === 'string' || typeof item === 'number') {
			return {
				label: item.toString(),
				value: item.toString(),
				index,
				isGroupHeader: false,
			};
		} else if ('label' in item && 'value' in item) {
			return {
				label: item.label,
				value: item.value.toString(),
				index,
				isGroupHeader: false,
			};
		} else if ('group' in item && 'items' in item) {
			// Handle ComboboxItemGroup
			return [
				{
					label: item.group,
					value: '',
					index,
					isGroupHeader: true,
				},
				...item.items.map((subItem, subIndex) => ({
					label: typeof subItem === 'string' ? subItem : subItem.label,
					value: typeof subItem === 'string' ? subItem : subItem.value.toString(),
					index: subIndex,
					isGroupHeader: false,
				})),
			];
		}
		return [];
	});
};

// --------------------------------------------------------------------------------
// SearchableSelect
// --------------------------------------------------------------------------------
export function SearchableSelect(props: CustomSelectProps) {
	const stringDefaultValue = props.defaultValue?.toString();
	const [searchText, setSearchText] = useState('');
	const [enterPressed, setEnterPressed] = useState(false);
	const [dropdownOpened, setDropdownOpened] = useState(false);
	const [filteredOptionCount, setFilteredOptionCount] = useState(0);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [filteredData, setFilteredData] = useState<SelectData>(transformData(props.data));
	const comboboxRef = useRef<HTMLInputElement>(null);

	const contextValue = {
		searchText,
		setSearchText,
		enterPressed,
		setEnterPressed,
		dropdownOpened,
		setDropdownOpened,
		filteredOptionCount,
		setFilteredOptionCount,
		selectedIndex,
		setSelectedIndex,
	};

	const handleDropdownOpen = () => {
		setSearchText('');
		setDropdownOpened(true);
		setSelectedIndex(0);
	};

	const handleDropdownClose = () => {
		setDropdownOpened(false);
		setSelectedIndex(-1);
		comboboxRef.current?.focus();
	};

	useEffect(() => {
		// Filter the data based on searchText
		const filtered = transformData(props.data)
			.filter(item => item.label.toLowerCase().includes(searchText.toLowerCase()))
			.map((item, index) => ({ ...item, index })); // Add index after filtering

		// Add the "REPLACE_WITH_INPUT" item at the beginning of the filtered array
		setFilteredData(['REPLACE_WITH_INPUT', ...filtered]);
		setFilteredOptionCount(filtered.length);
		setSelectedIndex(0);
	}, [searchText, props.data]);

	if (!props.data) return null;

	// Set disabled and placeholder if no options are available
	let disabled = false;
	let placeholder = props.placeholder;
	if (props.data.length === 0) {
		disabled = true;
		placeholder = 'No options available';
	}

	// Override onChange to allow using numerical data for values
	const handleChange = (value: string | null, option: CustomComboboxItem) => {
		const isNumericalData = props.data.some((item) => {
			if (typeof item === 'number') return true;
			if (typeof item === 'object' && 'value' in item && typeof item.value === 'number') return true;
			if (typeof item === 'object' && 'items' in item) {
				return item.items.some(subItem => typeof subItem === 'number' || (typeof subItem === 'object' && 'value' in subItem && typeof subItem.value === 'number'));
			}
			return false;
		});

		if (isNumericalData) props.onChange?.(Number(value), option);
		else props.onChange?.(value, option);
	};

	return (
		<SearchableSelectContext.Provider value={contextValue}>
			<Select
				searchable={false}
				disabled={disabled}
				placeholder={placeholder}
				className="m-0 w-full p-0"
				renderOption={renderSelectOption}
				onDropdownOpen={handleDropdownOpen}
				onDropdownClose={handleDropdownClose}
				{...props}
				defaultValue={stringDefaultValue}
				data={filteredData}
				ref={comboboxRef}
				onChange={handleChange}
			/>
		</SearchableSelectContext.Provider>
	);
}

// Add a custom hook for using the context
function useSearchableSelect() {
	const context = useContext(SearchableSelectContext);
	if (!context) {
		throw new Error('useSearchableSelect must be used within SearchableSelectContext.Provider');
	}
	return context;
}

// --------------------------------------------------------------------------------
// Helper - Option Component
// --------------------------------------------------------------------------------

interface CustomComboboxItemRenderOptions {
	option: CustomComboboxItem & { index: number }
	checked?: boolean
}

function SearchableSelectOption(props: CustomComboboxItemRenderOptions) {
	const { selectedIndex, setSelectedIndex, enterPressed, setEnterPressed } = useSearchableSelect();
	const { hovered, ref } = useHover<HTMLDivElement>();

	useEffect(() => {
		if (hovered) setSelectedIndex(props.option.index);
	}, [hovered]);

	// When the selected index changes, set the selected attribute on the option
	useEffect(() => {
		if (props.option.index === selectedIndex) {
			ref.current?.parentElement?.setAttribute('data-combobox-selected', 'true');
			if (!hovered) ref.current?.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		} else {
			ref.current?.parentElement?.removeAttribute('data-combobox-selected');
		}
	}, [props.option.index, selectedIndex]);

	// Trigger - when enter key is pressed, trigger option selection
	useEffect(() => {
		if (enterPressed && props.option.index === selectedIndex) {
			ref.current?.click();
		}
		setEnterPressed(false);
	}, [enterPressed]);

	return (
		<div className="flex w-full items-center px-[10px] py-[6px]" ref={ref}>
			{/* Icon */}
			<div className="flex w-6 items-center">
				{props.checked && <LuCheckCircle2 />}
			</div>
			{props.option.label}
		</div>
	);
}

const renderSelectOption: SelectProps['renderOption'] = props => (
	<>
		{props.option.label === 'REPLACE_WITH_INPUT'
			? (<SearchableSelectSearchField />)
			: (<SearchableSelectOption {...props} />)}
	</>
);

// --------------------------------------------------------------------------------
// Helper - Search Field (1st option)
// --------------------------------------------------------------------------------
function SearchableSelectSearchField() {
	const {
		dropdownOpened,
		searchText,
		setSearchText,
		filteredOptionCount,
		selectedIndex,
		setSelectedIndex,
		setEnterPressed,
		setDropdownOpened,
	} = useSearchableSelect();

	const textInputRef = useRef<HTMLInputElement>(null);

	// Needed to stop the dropdown from closing, and instead focus the input
	const handleTextInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
		e.stopPropagation();
		textInputRef.current?.focus();
	};

	// Focus the input after the dropdown opens. Without a delay, the input doesn't get focused.
	useEffect(() => {
		if (dropdownOpened) {
			setTimeout(() => {
				textInputRef.current?.focus();
			}, 100);
		}
	}, [dropdownOpened]);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'ArrowDown') {
			setSelectedIndex(Math.min(selectedIndex + 1, filteredOptionCount - 1));
		} else if (e.key === 'ArrowUp') {
			setSelectedIndex(Math.max(selectedIndex - 1, 0));
		} else if (e.key === 'Enter') {
			e.preventDefault();
			setEnterPressed(true);
		}
	};

	// When the dropdown is closed, an onChange is triggered with empty text causing an animation rerender + flicker
	// This prevents it from being registered by first ensuring that the dropdown is still open
	const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (dropdownOpened) {
			setSearchText(e.currentTarget.value);
		}
	};

	return (
		// Add 4px to the width to account for the scrollarea padding
		<div className="relative mb-[4px] w-[calc(100%+4px)] cursor-default" onClick={handleTextInputClick}>

			{/* Search input */}
			<TextInput
				data-mantine-stop-propagation="true" // prevents escape key from closing a modal
				leftSection={<LuSearch />}
				placeholder="Search..."
				variant="unstyled"
				value={searchText}
				onChange={handleTextInputChange}
				className="fixed mb-[2px] mt-[-2px] w-full border-b border-b-bd-light bg-mantine-body pb-[2px]"
				ref={textInputRef}
				onKeyDown={handleKeyDown}
			/>

			<div className="h-[37px] bg-red-500"></div>

			{/* No results text */}
			{searchText !== '' && filteredOptionCount === 0 && (
				<div className="w-full px-3 pt-2">
					No results found.
				</div>
			)}
		</div>
	);
}
