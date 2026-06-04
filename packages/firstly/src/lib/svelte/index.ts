export { errorMessage, isError } from '../core/helper.js'
export { ff } from './ff.svelte.js'
export type {
	FF_Many,
	FF_One,
	FF_Builder,
	FF_RepoOptions,
	FF_OneOptions,
	FF_RepoLoading,
	FF_Issue,
	ManyStrategy,
	AggregateOptions,
	QueryOptionsHelper,
} from './ff.svelte.js'
export { infiniteScroll } from './infiniteScroll.js'
export type { InfiniteScrollOptions } from './infiniteScroll.js'
export { dialog, ffAutofocus, resolveMessage } from './dialog.svelte.js'
export type {
	DialogResult,
	DialogClose,
	DialogOptions,
	DialogItem,
	DialogRender,
	ConfirmItem,
	PromptItem,
	DialogShellArgs,
	DialogConfirmArgs,
	DialogPromptArgs,
} from './dialog.svelte.js'
export type { LocalizedMessage } from '../core/FF_Validators.js'
export { default as FF_DialogManager } from './FF_DialogManager.svelte'
export { default as FF_Config } from './FF_Config.svelte'
export { ffConfig, setFFConfig } from './FF_Config.svelte.js'
export type { FF_ConfigValue } from './FF_Config.svelte.js'
export { toast } from './toast.js'
export type { ToastKind, ToastOptions } from './toast.js'
export { default as FF_ToastManager } from './FF_ToastManager.svelte'
export { SP } from './class/SP.svelte'
export type { ParamDefinition } from './class/SP.svelte'
export { initRemultSvelteReactivity } from './initRemultSvelteReactivity'

// Headless cell primitives (FF_Grid / FF_Group are boutique-only — copy from src/boutique/grid).
export {
	FF_Cell,
	FF_CellValue,
	buildCells,
	displayCell,
	resolveCellComponent,
	getFieldMetaType,
	getInputType,
	getStyle,
	getCellElementConfig,
	defaultConfig,
} from './grid/index.js'
export type {
	Cell,
	CellInput,
	CellComponent,
	CellUI,
	MetaKind,
	CellConfig,
	CellElementConfig,
	CellProps,
	CellContentProps,
	CellElementProps,
	CellMode,
	HubConfig,
	ActionConfig,
} from './grid/index.js'
export { default as Icon } from './ui/Icon.svelte'
export {
	LibIcon_Empty,
	LibIcon_Forbidden,
	LibIcon_ChevronDown,
	LibIcon_ChevronUp,
	LibIcon_ChevronLeft,
	LibIcon_ChevronRight,
	LibIcon_Search,
	LibIcon_Check,
	LibIcon_MultiCheck,
	LibIcon_Add,
	LibIcon_MultiAdd,
	LibIcon_Edit,
	LibIcon_Eye,
	LibIcon_EyeOff,
	LibIcon_Delete,
	LibIcon_Cross,
	LibIcon_Save,
	LibIcon_Man,
	LibIcon_Woman,
	LibIcon_Send,
	LibIcon_Load,
	LibIcon_Settings,
	LibIcon_Sort,
	LibIcon_SortAsc,
	LibIcon_SortDesc,
} from './ui/LibIcon.js'
