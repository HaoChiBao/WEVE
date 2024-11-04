console.log('_______________ANNOTATE_______________');

const wrapInHighlightSpan = (text) => {
    const highlightSpan = document.createElement("WEVEhighlight");
    highlightSpan.style.backgroundColor = "yellow";
    highlightSpan.textContent = text;
    return highlightSpan;
};

window.addEventListener('load', async () => {
    setTimeout(async () => {
        const highlights = await chrome.storage.local.get("selection");
        const ca = await chrome.storage.local.get("commonAncestor");
        console.log(ca)
        if (highlights.selection && ca.commonAncestor) {
            const highlightSelections = highlights.selection
            const commonAncestorIndex = (ca.commonAncestor).index
            const commonAncestorTagName = (ca.commonAncestor).tagName
            const commonAncestor = Array.from(document.querySelectorAll(commonAncestorTagName))[commonAncestorIndex]

            // console.log(commonAncestor)

            // console.log(highlightSelections)
            
            const walker = document.createTreeWalker(
                commonAncestor,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: (node) => {
                        // return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                        return NodeFilter.FILTER_ACCEPT
                    },
                },
                false
            );
            
            const nodesToHighlight = [];
            let currentNode;
            while ((currentNode = walker.nextNode())) {
                nodesToHighlight.push(currentNode);
            }

            // console.log(nodesToHighlight)
            // return

            nodesToHighlight.forEach( (node, i) => {
                let index = null
                let isStartNode = null
                let isEndNode = null
                let startOffset = null
                let endOffset = null

                highlightSelections.forEach(selection => {
                    if (selection.index != i) return

                    index = selection.index
                    isStartNode = selection.isStartNode
                    isEndNode = selection.isEndNode
                    startOffset = selection.start
                    endOffset = selection.end
                })

                if (index == null) return
    
                let textToHighlight;
                if (isStartNode && isEndNode) {
                    textToHighlight = node.textContent.slice(startOffset, endOffset);
                } else if (isStartNode) {
                    textToHighlight = node.textContent.slice(startOffset);
                } else if (isEndNode) {
                    textToHighlight = node.textContent.slice(0, endOffset);
                } else {
                    textToHighlight = node.textContent;
                }
    
                const highlightedSpan = wrapInHighlightSpan(textToHighlight);
                const replacementRange = document.createRange();
                replacementRange.setStart(node, startOffset);
                replacementRange.setEnd(node, endOffset);
    
                replacementRange.deleteContents();
                replacementRange.insertNode(highlightedSpan);
            })            
    
        }

    }, 1000)

});


document.addEventListener("mouseup", () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const highlights = [];

    const commonAncestor = range.commonAncestorContainer
    const commonAncestorIndex = (Array.from(document.querySelectorAll(commonAncestor.tagName))).indexOf(commonAncestor)
    console.log(commonAncestor)
    console.log(commonAncestorIndex)

    let highlightedText = "";

    const saveHighlight = (index, isStartNode = false, isEndNode = false, startOffset, endOffset) => {
        // console.log(parent)
        // const typeOfElements = Array.from(document.querySelectorAll(parent.tagName))

        highlight_piece = {
            index,
            isStartNode,
            isEndNode,
            start: startOffset,
            end: endOffset
        }

        highlights.push(highlight_piece);
    }

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

            saveHighlight(startContainer.parentNode, true, true, range)
            return;
        } 

        const walkerFiltered = document.createTreeWalker(
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
        while ((currentNode = walkerFiltered.nextNode())) {
            nodesToHighlight.push(currentNode);
        }

        const walkerUnfiltered = document.createTreeWalker(
            range.commonAncestorContainer,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    return NodeFilter.FILTER_ACCEPT
                },
            },
            false
        );

        const nodesToCompare = [];
        let currentComp;
        while ((currentComp = walkerUnfiltered.nextNode())) {
            nodesToCompare.push(currentComp);
        }
        
        nodesToHighlight.forEach(node => {

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

            saveHighlight(nodesToCompare.indexOf(node), isStartNode, isEndNode, startOffset, endOffset)
        });

    };
    
    highlightRange(range);
    selection.removeAllRanges();
    chrome.storage.local.set({selection:highlights})
    chrome.storage.local.set({commonAncestor: {
        index: commonAncestorIndex,
        tagName: commonAncestor.tagName
    }})
    // console.log(highlights)
    console.log("Highlighted Text:", highlightedText);
});


