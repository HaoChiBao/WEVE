
document.addEventListener("mouseup", () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const commonAncestor = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
        ? range.commonAncestorContainer.parentNode
        : range.commonAncestorContainer;

    const highlights = [];
    let highlightedText = "";

    const serializeHighlightRange = (range, parentContent) => {
        const textContent = parentContent.textContent;
        const start = textContent.indexOf(range.toString());
        const end = start + range.toString().length;
        return { start, end };
    };

    const wrapInHighlightSpan = (text) => {
        const highlightSpan = document.createElement("span");
        highlightSpan.style.backgroundColor = "yellow";
        highlightSpan.textContent = text;
        return highlightSpan;
    };

    const highlightRange = (range) => {
        const startContainer = range.startContainer;
        const endContainer = range.endContainer;

        if (startContainer === endContainer) {
            const selectedText = startContainer.textContent.slice(range.startOffset, range.endOffset);
            highlightedText += selectedText;

            const highlightedSpan = wrapInHighlightSpan(selectedText);
            const singleRange = document.createRange();
            singleRange.setStart(startContainer, range.startOffset);
            singleRange.setEnd(startContainer, range.endOffset);

            singleRange.deleteContents();
            singleRange.insertNode(highlightedSpan);

            highlights.push(serializeHighlightRange(singleRange, commonAncestor));
            return;
        }

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

            highlightedText += textToHighlight;

            const highlightedSpan = wrapInHighlightSpan(textToHighlight);
            const replacementRange = document.createRange();
            const startOffset = isStartNode ? range.startOffset : 0;
            const endOffset = isEndNode ? range.endOffset : node.textContent.length;
            replacementRange.setStart(node, startOffset);
            replacementRange.setEnd(node, endOffset);

            replacementRange.deleteContents();
            replacementRange.insertNode(highlightedSpan);

            highlights.push(serializeHighlightRange(replacementRange, commonAncestor));
        });
    };

    highlightRange(range);
    selection.removeAllRanges();
    console.log("Highlighted Text:", highlightedText);
});
