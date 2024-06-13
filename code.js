"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
console.clear();
figma.showUI(__html__, { width: 400, height: 300 });
console.log('Plugin started!');
figma.on('selectionchange', () => {
    const selectedSections = figma.currentPage.selection.filter(node => node.type === 'SECTION');
    figma.ui.postMessage({ type: 'selection-count', count: selectedSections.length });
});
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if (msg.type === 'create-json') {
        try {
            const selectedSections = figma.currentPage.selection.filter(node => node.type === 'SECTION');
            if (selectedSections.length === 0) {
                figma.notify('Please select at least one section.');
                return;
            }
            const exportData = {
                file: figma.root.name,
                sections: {}
            };
            const processSection = (section) => {
                const sectionData = {
                    sticky_notes: {},
                    text_fields: {},
                    nested_sections: {}
                };
                if ('children' in section) {
                    for (const child of section.children) {
                        if (child.type === 'STICKY') {
                            sectionData.sticky_notes["sticky " + child.id] = child.text.characters;
                        }
                        else if (child.type === 'TEXT') {
                            sectionData.text_fields["text_field " + child.id] = child.characters;
                        }
                        else if (child.type === 'SECTION') {
                            sectionData.nested_sections[child.name] = processSection(child);
                        }
                    }
                }
                return sectionData;
            };
            for (const section of selectedSections) {
                exportData.sections[section.name] = processSection(section);
            }
            // Convert the export data to a JSON string
            const jsonString = JSON.stringify(exportData, null, 2);
            // Send the JSON data to the UI
            figma.ui.postMessage({ type: 'json-data', data: jsonString });
        }
        catch (error) {
            figma.notify('An error occurred while exporting to JSON.');
            console.error('Export error:', error);
        }
    }
    if (msg.type === 'close-plugin') {
        figma.closePlugin();
    }
    if (msg.type === 'copy-to-clipboard') {
        figma.notify('JSON data copied to clipboard!');
        figma.ui.postMessage({ type: 'copyToClipboard', data: msg.data });
    }
});
