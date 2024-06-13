console.clear();
figma.showUI(__html__, { width: 400, height: 300 });
console.log('Plugin started!');

type SectionDataType = {
  sticky_notes: { [key: string]: string };
  text_fields: { [key: string]: string };
  nested_sections?: { [key: string]: SectionDataType };
};

figma.on('selectionchange', () => {
  const selectedSections = figma.currentPage.selection.filter(node => node.type === 'SECTION');
  figma.ui.postMessage({ type: 'selection-count', count: selectedSections.length });
});

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'create-json') {
    try {
      const selectedSections = figma.currentPage.selection.filter(node => node.type === 'SECTION');

      if (selectedSections.length === 0) {
        figma.notify('Please select at least one section.');
        return;
      }

      const exportData = {
        file: figma.root.name,
        sections: {} as { [key: string]: SectionDataType }
      };

      const processSection = (section: SceneNode): SectionDataType => {
        const sectionData: SectionDataType = {
          sticky_notes: {},
          text_fields: {},
          nested_sections: {}
        };

        if ('children' in section) {
          for (const child of section.children) {
            if (child.type === 'STICKY') {
              sectionData.sticky_notes["sticky " + child.id] = child.text.characters;
            } else if (child.type === 'TEXT') {
              sectionData.text_fields["text_field " + child.id] = child.characters;
            } else if (child.type === 'SECTION') {
              sectionData.nested_sections![child.name] = processSection(child);
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
    } catch (error) {
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
};
