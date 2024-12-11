import { Plugin, Notice, MarkdownView, TFile, App } from 'obsidian';

interface ReadOnlyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: ReadOnlyPluginSettings = {
	mySetting: 'default'
}

export default class ReadOnlyPlugin extends Plugin {
	settings: ReadOnlyPluginSettings;
	private cachedViewMode: string = 'source';
	private cachedAlreadyReadOnly: boolean = false;

	async onload() {
		await this.loadSettings();
		this.registerEvent(this.app.workspace.on('file-open', this.setReadModeIfTagPresent.bind(this)));
	}

	private setReadModeIfTagPresent(file: TFile) {
		if (!file) return;

		this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			const leaf = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!leaf) return;

			if (this.hasReadOnlyTag(frontmatter)) {
				// Cache only if it is not cached already
				if (!this.cachedAlreadyReadOnly) {
					this.cachedViewMode = leaf.getMode(); // cache current mode
					this.cachedAlreadyReadOnly = true
				}

				this.setViewToPreviewMode(file);
			} else {
				// Restore cached mode for non-readonly files
				this.cachedAlreadyReadOnly = false;
				leaf.setState({ mode: this.cachedViewMode }, { history: false });
			}
		});
	}

	private hasReadOnlyTag(frontmatter: any): boolean {
		return frontmatter.tags?.includes('read-only') || frontmatter.tags?.includes('readonly');
	}

	private setViewToPreviewMode(file: TFile) {
		this.app.workspace.iterateAllLeaves((leaf) => {
			if (leaf.view instanceof MarkdownView && leaf.view.file === file) {
				leaf.view.setState({ mode: "preview" }, { history: false });
			}
		});
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
