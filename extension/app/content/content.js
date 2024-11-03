console.log('annotate')

document.addEventListener("mouseup", () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    let highlightedText = ""; // Variable to store all highlighted text

    // Helper function to wrap text in a highlight span
    const wrapInHighlightSpan = (text) => {
        const highlightSpan = document.createElement("span");
        highlightSpan.style.backgroundColor = "yellow";
        highlightSpan.textContent = text;
        return highlightSpan;
    };

    // Function to highlight text in the selection range
    const highlightRange = (range) => {
        const startContainer = range.startContainer;
        const endContainer = range.endContainer;

        // If the selection is within a single element, handle it separately
        if (startContainer === endContainer) {
            const selectedText = startContainer.textContent.slice(range.startOffset, range.endOffset);
            highlightedText += selectedText; // Add to highlighted text variable

            const highlightedSpan = wrapInHighlightSpan(selectedText);

            const singleRange = document.createRange();
            singleRange.setStart(startContainer, range.startOffset);
            singleRange.setEnd(startContainer, range.endOffset);

            singleRange.deleteContents();
            singleRange.insertNode(highlightedSpan);
            return; // Early exit since the entire selection is handled
        }

        // If the selection spans multiple elements, use TreeWalker to highlight each node
        const walker = document.createTreeWalker(
            range.commonAncestorContainer,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                },
            },
            false
        );

        const nodesToHighlight = [];
        let currentNode;
        while ((currentNode = walker.nextNode())) {
            nodesToHighlight.push(currentNode);
        }

        // Apply highlights to each node
        nodesToHighlight.forEach((node) => {
            const isStartNode = node === startContainer;
            const isEndNode = node === endContainer;

            let textToHighlight;
            if (isStartNode && isEndNode) {
                textToHighlight = node.textContent.slice(range.startOffset, range.endOffset);
            } else if (isStartNode) {
                textToHighlight = node.textContent.slice(range.startOffset);
            } else if (isEndNode) {
                textToHighlight = node.textContent.slice(0, range.endOffset);
            } else {
                textToHighlight = node.textContent;
            }

            highlightedText += textToHighlight; // Add to highlighted text variable

            const highlightedSpan = wrapInHighlightSpan(textToHighlight);
            const replacementRange = document.createRange();
            const startOffset = isStartNode ? range.startOffset : 0;
            const endOffset = isEndNode ? range.endOffset : node.textContent.length;
            replacementRange.setStart(node, startOffset);
            replacementRange.setEnd(node, endOffset);

            replacementRange.deleteContents();
            replacementRange.insertNode(highlightedSpan);
        });
    };

    highlightRange(range);
    selection.removeAllRanges(); // Clear the selection so highlights are immediately visible

    console.log("Highlighted Text:", highlightedText); // Log the highlighted text
});
