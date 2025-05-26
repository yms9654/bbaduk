document.addEventListener('DOMContentLoaded', () => {
    const boardElement = document.getElementById('game-board');
    const currentPlayerSpan = document.getElementById('current-player');
    const timerSpan = document.getElementById('timer');
    const breakWallButton = document.getElementById('break-wall-button');
    const messageArea = document.getElementById('message-area');
    const confirmationArea = document.getElementById('confirmation-area');

    const BOARD_SIZE = 7;
    const PLAYERS = [
        { id: 1, color: 'red', name: '플레이어 1', pieces: [], wallBreakUsed: false },
        { id: 2, color: 'blue', name: '플레이어 2', pieces: [], wallBreakUsed: false },
        { id: 3, color: 'yellow', name: '플레이어 3', pieces: [], wallBreakUsed: false },
    ];

    let currentPlayerIndex = 0;
    let timer = 90;
    let timerInterval;
    let board = []; // 게임판의 상태 (셀 정보, 벽 정보 등)
    let placementPhase = true; // 말 놓기 단계
    let placementTurn = 0; // 말 놓기 턴 (0~2: 첫번째 말, 3~5: 두번째 말 역순)
    let piecePlacementOrder = []; // 첫번째 말 놓기 순서 저장
    let selectedPiece = null; // 현재 선택된 말 {player, pieceIndex, row, col}
    let isWallPlacementMode = false; // 벽 설치 모드인지 여부
    let isBreakingWallMode = false; // 벽 부수기 모드인지 여부

    // Helper function to check for wall obstruction between two cells
    function isWallObstructing(r1, c1, r2, c2) {
        const cell1 = board[r1][c1];
        // const cell2 = board[r2][c2]; // Not directly used for checking intermediate wall

        if (r1 === r2) { // Horizontal movement
            if (c1 < c2) { // Moving right
                return cell1.walls.right;
            } else { // Moving left
                return board[r1][c1-1].walls.right; // Check wall of the cell to the left
            }
        } else if (c1 === c2) { // Vertical movement
            if (r1 < r2) { // Moving down
                return cell1.walls.bottom;
            } else { // Moving up
                return board[r1-1][c1].walls.bottom; // Check wall of the cell above
            }
        }
        return false; // Diagonal or no movement, should not happen for wall check
    }

    // 게임 보드 생성
    function createBoard() {
        boardElement.innerHTML = '';
        board = [];
        for (let r = 0; r < BOARD_SIZE; r++) {
            const row = [];
            for (let c = 0; c < BOARD_SIZE; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = r;
                cell.dataset.col = c;
                cell.addEventListener('click', () => handleCellClick(r, c));
                boardElement.appendChild(cell);
                row.push({
                    element: cell,
                    piece: null, // 어떤 플레이어의 말이 있는지
                    walls: { top: false, bottom: false, left: false, right: false } // 벽 정보
                });
            }
            board.push(row);
        }
    }

    // 메시지 표시 함수
    let messageTimeout;
    function displayMessage(message, type = 'info', duration = 3000) {
        messageArea.textContent = message;
        messageArea.className = ''; // 기본 클래스 초기화
        if (type === 'error') {
            messageArea.classList.add('error');
        } else if (type === 'success') {
            messageArea.classList.add('success');
        } else {
            // 'info' 또는 기타 타입은 기본 스타일 사용
        }
        
        clearTimeout(messageTimeout);
        if (duration > 0) {
            messageTimeout = setTimeout(() => {
                messageArea.textContent = '';
                messageArea.className = '';
            }, duration);
        }
    }

    // 확인/취소 대화상자 함수
    function showConfirmation(message, onConfirm, onCancel) {
        displayMessage(message, 'info', 0); // 확인 메시지는 자동 소멸 안 함
        confirmationArea.innerHTML = ''; // 이전 버튼들 제거

        const confirmButton = document.createElement('button');
        confirmButton.textContent = '예';
        confirmButton.onclick = () => {
            confirmationArea.innerHTML = '';
            messageArea.textContent = ''; // 메시지도 함께 클리어
            messageArea.className = '';
            if (onConfirm) onConfirm();
        };

        const cancelButton = document.createElement('button');
        cancelButton.textContent = '아니오';
        cancelButton.onclick = () => {
            confirmationArea.innerHTML = '';
            messageArea.textContent = ''; // 메시지도 함께 클리어
            messageArea.className = '';
            if (onCancel) onCancel();
        };

        confirmationArea.appendChild(confirmButton);
        confirmationArea.appendChild(cancelButton);
    }

    // 벽 설치 로직
    function placeWall(r, c, direction, color) {
        const cell = board[r][c];
        let oppositeCell = null;
        let oppositeWallDirection = null;

        // 이미 벽이 있는지 확인
        if (cell.walls[direction]) {
            throw new Error("이미 해당 방향에 벽이 존재합니다.");
        }

        // 벽 정보 업데이트 및 CSS 클래스 추가 (자기 셀에만, 단 가장자리 셀은 제외)
        if (
            (direction === "top" && r === 0) ||
            (direction === "bottom" && r === BOARD_SIZE - 1) ||
            (direction === "left" && c === 0) ||
            (direction === "right" && c === BOARD_SIZE - 1)
        ) {
            // 가장자리 셀은 벽 클래스를 추가하지 않음
            cell.walls[direction] = true;
        } else {
            cell.walls[direction] = true;
            cell.element.classList.add(`wall-${direction}`);
            cell.element.classList.add(`wall-${color.toLowerCase()}`);
        }

        // 인접 셀에는 벽 정보만 업데이트 (CSS 클래스는 추가하지 않음)
        if (direction === "top" && r > 0) {
            oppositeCell = board[r - 1][c];
            oppositeWallDirection = "bottom";
        } else if (direction === "bottom" && r < BOARD_SIZE - 1) {
            oppositeCell = board[r + 1][c];
            oppositeWallDirection = "top";
        } else if (direction === "left" && c > 0) {
            oppositeCell = board[r][c - 1];
            oppositeWallDirection = "right";
        } else if (direction === "right" && c < BOARD_SIZE - 1) {
            oppositeCell = board[r][c + 1];
            oppositeWallDirection = "left";
        }
        if (oppositeCell) {
            if (oppositeCell.walls[oppositeWallDirection]) {
                // 데이터 불일치 방지
                cell.walls[direction] = false;
                cell.element.classList.remove(`wall-${direction}`);
                cell.element.classList.remove(`wall-${color.toLowerCase()}`);
                throw new Error("인접한 칸에 이미 반대 방향 벽이 존재합니다. (데이터 불일치 가능성)");
            }
            oppositeCell.walls[oppositeWallDirection] = true;
            // CSS 클래스는 추가하지 않음!
        }
        console.log(`Wall placed at (${r},${c}) direction: ${direction}, color: ${color}`);
    }

    // 셀 클릭 처리
    function handleCellClick(row, col) {
        console.log(`Cell clicked: (${row}, ${col}), placementPhase: ${placementPhase}, isWallPlacementMode: ${isWallPlacementMode}`);
        if (placementPhase) {
            handlePiecePlacement(row, col);
        } else {
            const currentPlayer = PLAYERS[currentPlayerIndex];
            const targetCell = board[row][col];

            if (isWallPlacementMode) {
                handleWallPlacement(row, col);
                return;
            }

            if (selectedPiece) {
                console.log('Piece already selected (raw):', selectedPiece);
                if (selectedPiece.player.id === currentPlayer.id) {
                    if (row === selectedPiece.row && col === selectedPiece.col) {
                        showConfirmation("제자리 이동을 하고 벽을 설치하시겠습니까? (2칸 이동으로 간주)", 
                            () => { // onConfirm
                                console.log('Confirming stay-in-place for piece at:', selectedPiece.row, selectedPiece.col);
                                const cellToDeselect = board[selectedPiece.row][selectedPiece.col];
                                if (cellToDeselect && cellToDeselect.element) {
                                    console.log('Stay-in-place: Removing .selected-cell from:', cellToDeselect.element);
                                    cellToDeselect.element.classList.remove('selected-cell');
                                } else {
                                    console.warn('Stay-in-place: Cell element to deselect not found for:', selectedPiece.row, selectedPiece.col);
                                }
                                movedPieceForWallPlacement = {
                                    player: selectedPiece.player,
                                    piece: selectedPiece.player.pieces[selectedPiece.pieceIndex],
                                    row: selectedPiece.row,
                                    col: selectedPiece.col
                                };
                                selectedPiece = null;
                                isWallPlacementMode = true;
                                displayMessage(`제자리 이동을 선택했습니다. 이제 말(${movedPieceForWallPlacement.row}, ${movedPieceForWallPlacement.col})의 상/하/좌/우 중 벽을 설치할 방향의 인접 칸을 클릭하세요.`, 'info', 0);
                                clearInterval(timerInterval);
                            },
                            () => { // onCancel
                                console.log("제자리 이동 취소됨.");
                                displayMessage("제자리 이동이 취소되었습니다.", 'info', 2000);
                            }
                        );
                    } else {
                        console.log('Attempting to move selected piece to:', row, col);
                        handleMovePiece(row, col);
                    }
                } else {
                    console.warn("Selected piece does not belong to current player. This should not happen.");
                    clearSelection(); 
                }
            } else {
                if (targetCell.piece && targetCell.piece === currentPlayer.id) {
                    const pieceIndex = currentPlayer.pieces.findIndex(p => p.row === row && p.col === col);
                    if (pieceIndex !== -1) {
                        clearSelection(); 
                        selectedPiece = {
                            player: currentPlayer,
                            pieceIndex: pieceIndex,
                            row: row, 
                            col: col, 
                            element: currentPlayer.pieces[pieceIndex].element 
                        };
                        const loggableSelectedPiece = { ...selectedPiece, element: selectedPiece.element ? 'DOM Element Exists' : 'null' };
                        console.log('Selecting piece (loggable):', loggableSelectedPiece, 'Applying .selected-cell to:', targetCell.element);
                        targetCell.element.classList.add('selected-cell');
                        displayMessage("말을 선택했습니다. 이동할 칸을 클릭하거나, 선택한 말을 다시 클릭하여 제자리 이동 후 벽을 설치할 수 있습니다.", 'info', 0);
                        if (!currentPlayer.wallBreakUsed) {
                            breakWallButton.disabled = false;
                        }
                    } else {
                        console.error("선택된 말 정보를 찾을 수 없습니다. (pieceIndex not found - data inconsistency?)");
                    }
                } else {
                    if (targetCell.piece) {
                        displayMessage("상대방의 말은 선택할 수 없습니다.", "error");
                    } else {
                        displayMessage("자신의 말을 먼저 선택해주세요.", "error");
                    }
                }
            }
        }
    }

    // 말 놓기 처리
    function handlePiecePlacement(row, col) {
        const cell = board[row][col];
        if (cell.piece) {
            displayMessage("이미 다른 말이 있는 칸입니다.", 'error');
            return;
        }

        let currentPlayerForPlacement;
        if (placementTurn < PLAYERS.length) { // 첫번째 말 놓기
            currentPlayerForPlacement = piecePlacementOrder[placementTurn];
        } else { // 두번째 말 놓기 (역순)
            const secondPieceTurnIndex = placementTurn - PLAYERS.length;
            currentPlayerForPlacement = piecePlacementOrder[PLAYERS.length - 1 - secondPieceTurnIndex];
        }

        if (currentPlayerForPlacement.pieces.length < 2) {
            const pieceElement = document.createElement('div');
            pieceElement.classList.add('player-piece', `player${currentPlayerForPlacement.id}`);
            cell.element.appendChild(pieceElement);
            cell.piece = currentPlayerForPlacement.id;
            currentPlayerForPlacement.pieces.push({ row, col, element: pieceElement });

            placementTurn++;

            if (placementTurn >= PLAYERS.length * 2) {
                placementPhase = false;
                // 실제 게임 시작 시 currentPlayerIndex는 piecePlacementOrder[0]의 인덱스로 설정
                const firstPlayerActualIndex = PLAYERS.findIndex(p => p.id === piecePlacementOrder[0].id);
                currentPlayerIndex = firstPlayerActualIndex;
                updateCurrentPlayerDisplay();
                displayMessage("모든 플레이어가 말을 놓았습니다. 게임을 시작합니다.", 'success', 0);
                // TODO: 첫 턴 플레이어의 말 선택 활성화 등 추가 로직 필요
            } else {
                updateCurrentPlayerDisplay(); // 다음 놓을 사람으로 업데이트
                 // 다음 놓을 사람에게 알림
                let nextPlayerForPlacement;
                if (placementTurn < PLAYERS.length) {
                    nextPlayerForPlacement = piecePlacementOrder[placementTurn];
                    displayMessage(`${nextPlayerForPlacement.name} (${nextPlayerForPlacement.color})님, 첫 번째 말을 놓아주세요.`, 'info', 0);
                } else {
                    const secondPieceTurnIndex = placementTurn - PLAYERS.length;
                    nextPlayerForPlacement = piecePlacementOrder[PLAYERS.length - 1 - secondPieceTurnIndex];
                    displayMessage(`${nextPlayerForPlacement.name} (${nextPlayerForPlacement.color})님, 두 번째 말을 놓아주세요.`, 'info', 0);
                }
            }
        } else {
             // 이 경우는 발생하면 안되지만, 방어적으로 다음 턴으로 넘김
            console.warn("현재 플레이어는 이미 말을 2개 다 놓았습니다. 다음 플레이어로 넘깁니다.");
            placementTurn++;
            if (placementTurn >= PLAYERS.length * 2) {
                placementPhase = false;
                const firstPlayerActualIndex = PLAYERS.findIndex(p => p.id === piecePlacementOrder[0].id);
                currentPlayerIndex = firstPlayerActualIndex;
                updateCurrentPlayerDisplay();
            } else {
                updateCurrentPlayerDisplay();
            }
        }
    }

    // 말 이동 처리 (기본 한 칸 이동)
    function handleMovePiece(newRow, newCol) {
        if (!selectedPiece) return;

        const { player, pieceIndex, row: oldRow, col: oldCol, element } = selectedPiece;
        const dr = newRow - oldRow;
        const dc = newCol - oldCol;
        const dx = Math.abs(dr);
        const dy = Math.abs(dc);

        let isValidMove = false;
        let pathClear = true;
        let wallBroken = false;

        if (board[newRow][newCol].piece) {
            displayMessage("다른 말이 있는 곳으로는 이동할 수 없습니다.", 'error');
            clearSelection();
            return;
        }

        // 1. 이동 유효성 검사 (한 칸 이동)
        if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
            isValidMove = true;
            if (isWallObstructing(oldRow, oldCol, newRow, newCol)) {
                if (isBreakingWallMode && !player.wallBreakUsed) {
                    pathClear = true; // 벽 부수기 모드이고, 아직 사용 안했으면 통과
                    wallBroken = true;
                } else {
                    pathClear = false;
                }
            }
        }
        // 2. 두 칸 이동 검사 (직선, 직각, 제자리 복귀)
        else if (
            (dx === 2 && dy === 0) || (dx === 0 && dy === 2) || // 직선
            (dx === 1 && dy === 1) ||                           // 직각
            (dx === 0 && dy === 0)                              // 제자리 복귀
        ) {
            isValidMove = true;
            let possiblePaths = [];

            // 직선 2칸
            if ((dx === 2 && dy === 0) || (dx === 0 && dy === 2)) {
                const midRow = oldRow + dr / 2;
                const midCol = oldCol + dc / 2;
                possiblePaths.push([[oldRow, oldCol], [midRow, midCol], [newRow, newCol]]);
            }
            // 직각 2칸
            if (dx === 1 && dy === 1) {
                // 두 가지 경로 모두 허용
                possiblePaths.push([[oldRow, oldCol], [oldRow + Math.sign(dr), oldCol], [newRow, newCol]]);
                possiblePaths.push([[oldRow, oldCol], [oldRow, oldCol + Math.sign(dc)], [newRow, newCol]]);
            }
            // 제자리 복귀 (한 칸 이동 후 다시 복귀)
            if (dx === 0 && dy === 0) {
                const dirs = [
                    [-1, 0], [1, 0], [0, -1], [0, 1]
                ];
                for (const [dr1, dc1] of dirs) {
                    const midRow = oldRow + dr1;
                    const midCol = oldCol + dc1;
                    if (
                        midRow >= 0 && midRow < BOARD_SIZE &&
                        midCol >= 0 && midCol < BOARD_SIZE
                    ) {
                        possiblePaths.push([[oldRow, oldCol], [midRow, midCol], [oldRow, oldCol]]);
                    }
                }
            }

            // 경로 중 하나라도 유효하면 허용
            pathClear = false;
            for (const path of possiblePaths) {
                let valid = true;
                // 중간 칸에 말이 있으면 불가
                if (board[path[1][0]][path[1][1]].piece) valid = false;
                // 첫 구간 벽
                if (valid && isWallObstructing(path[0][0], path[0][1], path[1][0], path[1][1])) valid = false;
                // 두 번째 구간 벽
                if (valid && isWallObstructing(path[1][0], path[1][1], path[2][0], path[2][1])) valid = false;
                if (valid) {
                    pathClear = true;
                    break;
                }
            }
        }
        else {
            displayMessage("유효하지 않은 이동입니다. 상하좌우 한 칸 또는 두 칸만 이동할 수 있습니다.", 'error');
            clearSelection();
            return;
        }

        if (!pathClear && !isBreakingWallMode) {
            displayMessage("경로에 벽이 막혀있습니다.", 'error');
            clearSelection();
            return;
        } 
        if (!pathClear && isBreakingWallMode && player.wallBreakUsed){
            displayMessage("이미 벽 부수기를 사용했습니다.", 'error');
            clearSelection();
            return;
        }
        if (!pathClear && isBreakingWallMode && !player.wallBreakUsed && !wallBroken){
             displayMessage("벽을 부수려면 벽이 있는 경로로 이동해야 합니다.", 'error');
            clearSelection();
            return;
        }


        if (isValidMove && pathClear) {
            const oldCell = board[oldRow][oldCol];
            const newCell = board[newRow][newCol];

            // 벽 부수기 실행
            if (wallBroken) {
                if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) { // 한 칸 이동 시 벽 제거
                    removeWall(oldRow, oldCol, newRow, newCol);
                }
                else if ((dx === 2 && dy === 0) || (dx === 0 && dy === 2)) { // 두 칸 이동 시 벽 제거
                    const midRow = oldRow + dr / 2;
                    const midCol = oldCol + dc / 2;
                    if (isWallObstructing(oldRow, oldCol, midRow, midCol)) {
                        removeWall(oldRow, oldCol, midRow, midCol);
                    } else if (isWallObstructing(midRow, midCol, newRow, newCol)){
                        removeWall(midRow, midCol, newRow, newCol);
                    }
                }
                player.wallBreakUsed = true;
                breakWallButton.disabled = true;
                breakWallButton.textContent = "벽 부수기 (사용 완료)";
                isBreakingWallMode = false; // 벽 부수기 모드 해제
                displayMessage("벽을 부수고 이동했습니다!", 'success');
            }

            oldCell.element.removeChild(element);
            oldCell.piece = null;
            oldCell.element.classList.remove('selected-cell');

            newCell.element.appendChild(element);
            newCell.piece = player.id;
            player.pieces[pieceIndex] = { ...player.pieces[pieceIndex], row: newRow, col: newCol };

            movedPieceForWallPlacement = { player, piece: player.pieces[pieceIndex], row: newRow, col: newCol };

            console.log(`Piece moved from (${oldRow}, ${oldCol}) to (${newRow}, ${newCol})`);
            selectedPiece = null; // 선택 해제

            if (wallBroken) {
                nextTurn();
            } else {
                isWallPlacementMode = true;
                displayMessage(`말을 이동했습니다. 이제 이동한 말(${newRow}, ${newCol})의 상/하/좌/우 중 벽을 설치할 방향의 인접 칸을 클릭하세요.`, 'info', 0);
                clearInterval(timerInterval); // 벽 설치 전까지 타이머 중지
            }

        } else if (isValidMove && !pathClear) {
            displayMessage("경로가 막혀있거나 벽을 부술 수 없습니다.", 'error');
            clearSelection();
        }
    }

    function removeWall(r1, c1, r2, c2) {
        const cell1 = board[r1][c1];
        // 벽 색깔 제거는 기존대로, 하지만 CSS 클래스는 자기 셀만
        if (r1 === r2) { // Horizontal
            if (c1 < c2) { // Moving right
                cell1.walls.right = false;
                cell1.element.classList.remove("wall-right");
                cell1.element.className = cell1.element.className.replace(/wall-(red|blue|yellow)/g, '');
                if (c2 < BOARD_SIZE) {
                    board[r1][c2].walls.left = false;
                    // CSS 클래스는 제거하지 않음
                }
            } else { // Moving left (c1 > c2)
                board[r1][c2].walls.right = false;
                // CSS 클래스는 제거하지 않음
                cell1.walls.left = false;
                cell1.element.classList.remove("wall-left");
                cell1.element.className = cell1.element.className.replace(/wall-(red|blue|yellow)/g, '');
            }
        } else if (c1 === c2) { // Vertical
            if (r1 < r2) { // Moving down
                cell1.walls.bottom = false;
                cell1.element.classList.remove("wall-bottom");
                cell1.element.className = cell1.element.className.replace(/wall-(red|blue|yellow)/g, '');
                if (r2 < BOARD_SIZE) {
                    board[r2][c1].walls.top = false;
                    // CSS 클래스는 제거하지 않음
                }
            } else { // Moving up (r1 > r2)
                board[r2][c1].walls.bottom = false;
                // CSS 클래스는 제거하지 않음
                cell1.walls.top = false;
                cell1.element.classList.remove("wall-top");
                cell1.element.className = cell1.element.className.replace(/wall-(red|blue|yellow)/g, '');
            }
        }
        console.log(`Wall removed between (${r1},${c1}) and (${r2},${c2})`);
    }

    function clearSelection() {
        if (selectedPiece) {
            const loggableClearedPiece = { ...selectedPiece, element: selectedPiece.element ? 'DOM Element Exists' : 'null' };
            console.log('Clearing selection for piece previously at:', selectedPiece.row, selectedPiece.col, 'Full object (loggable):', loggableClearedPiece);
            const cellToClear = board[selectedPiece.row][selectedPiece.col];
            if (cellToClear && cellToClear.element) {
                console.log('Removing .selected-cell from:', cellToClear.element);
                cellToClear.element.classList.remove('selected-cell');
            } else {
                console.warn('Could not find cell element to clear selection for coordinates:', selectedPiece.row, selectedPiece.col);
            }
        }
        selectedPiece = null;
        isBreakingWallMode = false; 
        const currentPlayer = PLAYERS[currentPlayerIndex];
        if (currentPlayer) { 
            if (!currentPlayer.wallBreakUsed) { 
                breakWallButton.disabled = true; 
                breakWallButton.textContent = "벽 부수기 (남은 횟수: 1)";
            } else {
                breakWallButton.disabled = true;
                breakWallButton.textContent = "벽 부수기 (사용 완료)";
            }
        } else {
            console.warn('clearSelection: currentPlayer is not defined, cannot update breakWallButton state.');
        }
    }

    breakWallButton.addEventListener('click', () => {
        if (PLAYERS[currentPlayerIndex].wallBreakUsed) {
            displayMessage("이미 벽 부수기를 사용했습니다.", 'error');
            return;
        }
        if (!selectedPiece) {
            displayMessage("먼저 이동할 말을 선택하세요.", 'error');
            return;
        }
        isBreakingWallMode = true;
        breakWallButton.textContent = "벽 부수기 모드 (해제하려면 말 재선택)";
        breakWallButton.disabled = true; // 한번 활성화하면, 이동 성공/실패 또는 재선택 전까지 비활성화
        displayMessage("벽 부수기 모드가 활성화되었습니다. 벽을 부수고 이동할 경로를 선택하세요.", 'info', 0);
    });

    // 벽 설치 처리 (사용자가 이동한 말 주변의 인접 칸을 클릭)
    function handleWallPlacement(clickedRow, clickedCol) {
        if (!isWallPlacementMode || !movedPieceForWallPlacement) {
            // 이 경우는 거의 발생하지 않아야 함 (올바른 상태에서만 호출되므로)
            console.warn("Wall placement called in invalid state.");
            isWallPlacementMode = false;
            return;
        }

        const pieceR = movedPieceForWallPlacement.row;
        const pieceC = movedPieceForWallPlacement.col;
        let wallDirection = null;

        if (clickedRow === pieceR - 1 && clickedCol === pieceC) {
            wallDirection = "top";
        } else if (clickedRow === pieceR + 1 && clickedCol === pieceC) {
            wallDirection = "bottom";
        } else if (clickedRow === pieceR && clickedCol === pieceC - 1) {
            wallDirection = "left";
        } else if (clickedRow === pieceR && clickedCol === pieceC + 1) {
            wallDirection = "right";
        } else {
            displayMessage("잘못된 위치입니다. 이동한 말의 바로 인접한 상/하/좌/우 칸 중 하나를 클릭하여 벽을 설치하세요.", 'error');
            return;
        }
        
        try {
            placeWall(pieceR, pieceC, wallDirection, PLAYERS[currentPlayerIndex].color);
            displayMessage(`벽을 이동한 말(${pieceR},${pieceC})의 ${wallDirection} 방향에 설치했습니다.`, 'success');
            isWallPlacementMode = false;
            // selectedPiece는 이미 null 상태여야 함
            movedPieceForWallPlacement = null; // 벽 설치 대상 정보 초기화

            if (checkGameEndCondition()) {
                endGame();
            } else {
                nextTurn();
            }
        } catch (error) {
            displayMessage(error.message, 'error'); 
            // 벽 설치 실패 시, 사용자가 다른 곳에 다시 시도할 수 있도록 isWallPlacementMode를 유지할 수 있음
            // 현재는 다음 턴으로 넘어가거나 게임 종료됨. 필요시 이 부분 수정.
        }
    }

    // 현재 플레이어 정보 업데이트
    function updateCurrentPlayerDisplay() {
        if (placementPhase) {
            if (placementTurn < PLAYERS.length * 2) {
                let playerForDisplay;
                let turnType;
                if (placementTurn < PLAYERS.length) { // 첫번째 말 놓기
                    playerForDisplay = piecePlacementOrder[placementTurn];
                    turnType = "첫 번째 말 놓기";
                } else { // 두번째 말 놓기 (역순)
                    const secondPieceTurnIndex = placementTurn - PLAYERS.length;
                    playerForDisplay = piecePlacementOrder[PLAYERS.length - 1 - secondPieceTurnIndex];
                    turnType = "두 번째 말 놓기";
                }
                if (playerForDisplay) {
                    currentPlayerSpan.textContent = `${playerForDisplay.name} (${playerForDisplay.color}) - ${turnType}`;
                }
            } else {
                 // 모든 말이 놓인 후 (이 부분은 handlePiecePlacement에서 처리됨)
                 currentPlayerSpan.textContent = "게임 시작!";
            }
        } else {
            const player = PLAYERS[currentPlayerIndex];
            currentPlayerSpan.textContent = `${player.name} (${player.color})`;
            
            // 벽 부수기 버튼은 말 선택 시 활성화되므로, 턴 시작 시에는 일단 비활성화 또는 상태만 표시
            if (player.wallBreakUsed) {
                breakWallButton.textContent = "벽 부수기 (사용 완료)";
                breakWallButton.disabled = true;
            } else {
                breakWallButton.textContent = "벽 부수기 (남은 횟수: 1)";
                breakWallButton.disabled = true; // 턴 시작 시에는 비활성화, 말 선택 시 활성화
            }
        }
    }

    // 타이머 시작
    function startTimer() {
        timer = 90;
        timerSpan.textContent = timer;
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timer--;
            timerSpan.textContent = timer;
            if (timer === 0) {
                clearInterval(timerInterval);
                displayMessage('시간 초과! 임의의 벽이 세워집니다.', 'error', 0);
                handleTimeoutWallPlacement();
                // checkGameEndCondition() 호출은 nextTurn() 내부 또는 handleTimeoutWallPlacement 이후에 이루어짐
                // 만약 임의 벽 설치로 게임이 끝날 수 있다면 여기서도 체크 필요
                if (checkGameEndCondition()) {
                     endGame();
                } else {
                     nextTurn(); // 임의 벽 설치 후 다음 턴으로
                }
            }
        }, 1000);
    }

    function handleTimeoutWallPlacement() {
        const currentPlayer = PLAYERS[currentPlayerIndex];
        if (currentPlayer.pieces.length === 0) {
            console.log("시간 초과: 현재 플레이어의 말이 없어 임의 벽을 설치할 수 없습니다.");
            return; // 말이 없으면 벽 설치 불가
        }

        // 임의로 첫번째 말을 선택 (또는 다른 기준으로 선택 가능)
        const pieceToBuildAround = currentPlayer.pieces[0];
        const r = pieceToBuildAround.row;
        const c = pieceToBuildAround.col;

        const possibleDirections = ["top", "bottom", "left", "right"];
        const availableDirections = possibleDirections.filter(dir => {
            if (dir === "top") return r > 0 && !board[r][c].walls.top && !board[r-1][c].walls.bottom;
            if (dir === "bottom") return r < BOARD_SIZE - 1 && !board[r][c].walls.bottom && !board[r+1][c].walls.top;
            if (dir === "left") return c > 0 && !board[r][c].walls.left && !board[r][c-1].walls.right;
            if (dir === "right") return c < BOARD_SIZE - 1 && !board[r][c].walls.right && !board[r][c+1].walls.left;
            return false;
        });
        
        // 벽을 설치할 수 있는 면이 하나도 없을 경우 (모든 면에 벽이 있거나, 보드 가장자리라 한쪽면만 있는데 거기도 벽)
        // 이 부분은 좀 더 견고하게, board[r][c].walls[dir] 만 체크해도 될 수 있음 (placeWall에서 인접셀도 처리하므로)
        // placeWall 함수는 이미 해당 위치에 벽이 있는지 체크하므로, 여기서는 설치 가능한지만 단순하게 본다.
        const simpleAvailableDirections = possibleDirections.filter(dir => !board[r][c].walls[dir]);

        if (simpleAvailableDirections.length > 0) {
            const randomDirection = simpleAvailableDirections[Math.floor(Math.random() * simpleAvailableDirections.length)];
            try {
                placeWall(r, c, randomDirection, currentPlayer.color);
                displayMessage(`시간 초과로 ${currentPlayer.name}의 말(${r},${c}) 주변 ${randomDirection}에 임의의 벽이 설치되었습니다.`, 'info', 5000);
            } catch (error) {
                // 이 경우는 거의 발생하지 않아야 함 (이미 벽이 없는 곳을 골랐으므로)
                console.error("임의 벽 설치 중 오류:", error);
                displayMessage("임의의 벽을 설치하는 데 실패했습니다.", 'error');
            }
        } else {
            displayMessage("시간 초과: 현재 플레이어의 말 주변에 임의의 벽을 설치할 수 있는 공간이 없습니다.", 'info', 5000);
        }
        // 벽 설치 후 isWallPlacementMode 등 상태 변경은 필요 없음 (바로 다음 턴으로 가므로)
    }

    // 다음 턴으로 넘기기
    function nextTurn() {
        currentPlayerIndex = (currentPlayerIndex + 1) % PLAYERS.length;
        movedPieceForWallPlacement = null; // 다음 턴 시작 시 초기화
        isWallPlacementMode = false; // 벽 설치 모드 해제
        isBreakingWallMode = false; // 벽 부수기 모드 해제
        clearSelection(); // 선택된 말 해제
        updateCurrentPlayerDisplay();
        startTimer();
        // TODO: 다음 플레이어 턴 시작 관련 로직 (예: 말 선택 활성화)
    }
    
    // 공추첨으로 순서 결정
    function determineInitialOrder() {
        piecePlacementOrder = [...PLAYERS].sort(() => Math.random() - 0.5);
        console.log("결정된 플레이어 순서:", piecePlacementOrder.map(p => p.name));
    }

    // 게임 초기화
    function initGame() {
        boardElement.style.pointerEvents = 'auto'; // 게임 재시작 시 클릭 활성화
        const gameInfoNode = document.getElementById('game-info');
        const oldResultDiv = gameInfoNode.querySelector('div#game-result-display'); // 이전 결과창 찾기
        if(oldResultDiv && oldResultDiv.querySelector('h2')?.textContent === "게임 결과"){
            gameInfoNode.removeChild(oldResultDiv);
        }
        const oldRestartButton = gameInfoNode.querySelector('button#restart-game-btn');
        if(oldRestartButton) gameInfoNode.removeChild(oldRestartButton);

        createBoard();
        determineInitialOrder();
        placementPhase = true;
        placementTurn = 0;
        PLAYERS.forEach(player => {
            player.pieces = [];
            player.wallBreakUsed = false;
        });
        updateCurrentPlayerDisplay(); 
        displayMessage(`${piecePlacementOrder[0].name} (${piecePlacementOrder[0].color})님부터 첫번째 말을 놓아주세요.`, 'info', 0);
        confirmationArea.innerHTML = ''; // 재시작 시 확인 버튼 영역 초기화
    }

    function getReachableCells(startRow, startCol, walls) {
        const q = [[startRow, startCol]];
        const visited = new Set();
        const reachable = [];
        visited.add(`${startRow},${startCol}`);
        reachable.push({ r: startRow, c: startCol });

        while (q.length > 0) {
            const [r, c] = q.shift();

            const directions = [
                { dr: -1, dc: 0, wall: 'top', oppositeWall: 'bottom' }, // Up
                { dr: 1, dc: 0, wall: 'bottom', oppositeWall: 'top' },   // Down
                { dr: 0, dc: -1, wall: 'left', oppositeWall: 'right' },  // Left
                { dr: 0, dc: 1, wall: 'right', oppositeWall: 'left' }   // Right
            ];

            for (const dir of directions) {
                const nr = r + dir.dr;
                const nc = c + dir.dc;

                if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && !visited.has(`${nr},${nc}`)) {
                    // 현재 셀에서 nr, nc 방향으로 벽이 없고, nr, nc 셀에서 현재 셀 방향으로 벽이 없는지 확인
                    let wallPresent = false;
                    if (dir.wall === 'top') wallPresent = walls[r][c].walls.top || (nr >= 0 && walls[nr][nc].walls.bottom);
                    else if (dir.wall === 'bottom') wallPresent = walls[r][c].walls.bottom || (nr < BOARD_SIZE && walls[nr][nc].walls.top);
                    else if (dir.wall === 'left') wallPresent = walls[r][c].walls.left || (nc >=0 && walls[nr][nc].walls.right);
                    else if (dir.wall === 'right') wallPresent = walls[r][c].walls.right || (nc < BOARD_SIZE && walls[nr][nc].walls.left);
                    
                    // 수정된 벽 확인 로직
                    let currentCellWall = walls[r][c].walls[dir.wall];
                    let nextCellWall = false;
                    if (dir.oppositeWall && nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
                         nextCellWall = walls[nr][nc].walls[dir.oppositeWall];
                    }

                    if (!currentCellWall && !nextCellWall) {
                        visited.add(`${nr},${nc}`);
                        q.push([nr, nc]);
                        reachable.push({ r: nr, c: nc });
                    }
                }
            }
        }
        return reachable;
    }

    // 영역 계산 (특정 시작점에서 벽/다른 플레이어 말에 막히지 않고 도달 가능한 모든 셀)
    function getAreaForPlayer(row, col, playerId, board) {
        const visited = new Set();
        const stack = [[row, col]];
        const BOARD_SIZE = board.length;
        while (stack.length > 0) {
            const [r, c] = stack.pop();
            const key = `${r},${c}`;
            if (visited.has(key)) continue;
            visited.add(key);
            // 상하좌우 탐색
            const dirs = [
                { dr: -1, dc: 0, wall: 'top', opp: 'bottom' },
                { dr: 1, dc: 0, wall: 'bottom', opp: 'top' },
                { dr: 0, dc: -1, wall: 'left', opp: 'right' },
                { dr: 0, dc: 1, wall: 'right', opp: 'left' },
            ];
            for (const { dr, dc, wall, opp } of dirs) {
                const nr = r + dr, nc = c + dc;
                if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) continue;
                // 벽이 있으면 넘어가지 않음
                if (board[r][c].walls[wall]) continue;
                if (board[nr][nc].walls[opp]) continue;
                stack.push([nr, nc]);
            }
        }
        return visited;
    }

    function checkGameEndCondition() {
        // 1. 각 플레이어의 영역 집합 구하기
        const playerAreas = [];
        for (const player of PLAYERS) {
            for (const piece of player.pieces) {
                playerAreas.push(getAreaForPlayer(piece.row, piece.col, player.id, board));
            }
        }

        // 2. 모든 플레이어의 영역이 서로 겹치지 않는지(분리되어 있는지) 체크
        let allAreas = [];
        for (const area of playerAreas) {
            allAreas.push(new Set(area));
        }
        let isSeparated = true;
        for (let i = 0; i < allAreas.length; i++) {
            for (let j = i + 1; j < allAreas.length; j++) {
                for (const cell of allAreas[i]) {
                    if (allAreas[j].has(cell)) {
                        isSeparated = false;
                        break;
                    }
                }
                if (!isSeparated) break;
            }
            if (!isSeparated) break;
        }
        if (isSeparated) {
            // 영역이 완전히 분리됨 → 즉시 종료
            const playerFinalAreas = [];
            for (const player of PLAYERS) {
                let combinedPlayerArea = new Set();
                if (player.pieces.length > 0) {
                    player.pieces.forEach(p => {
                        const pieceArea = getAreaForPlayer(p.row, p.col, player.id, board);
                        pieceArea.forEach(cellString => combinedPlayerArea.add(cellString));
                    });
                }
                playerFinalAreas.push({ playerId: player.id, name: player.name, areaSet: combinedPlayerArea, cells: Array.from(combinedPlayerArea).map(s => {const [r,c] = s.split(','); return {r:parseInt(r),c:parseInt(c)};}), areaSize: combinedPlayerArea.size });
            }
            calculateAndSetScores(playerFinalAreas);
            return true;
        }

        let canAnyPlayerMove = false;
        for (const player of PLAYERS) {
            if (player.pieces.length === 0) continue;
            for (const piece of player.pieces) {
                const moves = [
                    { dr: -1, dc: 0 }, { dr: 1, dc: 0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 }, // 1칸
                    { dr: -2, dc: 0 }, { dr: 2, dc: 0 }, { dr: 0, dc: -2 }, { dr: 0, dc: 2 }  // 2칸
                ];
                for (const move of moves) {
                    const newR = piece.row + move.dr;
                    const newC = piece.col + move.dc;
                    if (newR >= 0 && newR < BOARD_SIZE && newC >= 0 && newC < BOARD_SIZE) {
                        let pathClearForCheck = true;
                        if (board[newR][newC].piece && board[newR][newC].piece !== player.id) {
                            pathClearForCheck = false;
                        }
                        if (pathClearForCheck) {
                            if (Math.abs(move.dr) === 1 || Math.abs(move.dc) === 1) {
                                if (isWallObstructing(piece.row, piece.col, newR, newC)) pathClearForCheck = false;
                            } else {
                                const midR = piece.row + move.dr / 2;
                                const midC = piece.col + move.dc / 2;
                                if (board[midR][midC].piece && board[midR][midC].piece !== player.id) pathClearForCheck = false;
                                if (pathClearForCheck && isWallObstructing(piece.row, piece.col, midR, midC)) pathClearForCheck = false;
                                if (pathClearForCheck && isWallObstructing(midR, midC, newR, newC)) pathClearForCheck = false;
                            }
                        }
                        if (pathClearForCheck) {
                            canAnyPlayerMove = true; break;
                        }
                    }
                }
                if (canAnyPlayerMove) break;
            }
            if (canAnyPlayerMove) break;
        }

        if (!canAnyPlayerMove) {
            console.log("No player can make a legal move.");
            // 영역 계산 및 분리 최종 확인
            const playerFinalAreas = [];
            const allBoardCells = new Set();
            for(let r=0; r<BOARD_SIZE; r++) for(let c=0; c<BOARD_SIZE; c++) allBoardCells.add(`${r},${c}`);
            
            const occupiedByPlayerArea = new Map(); // "r,c" -> playerId

            for (const player of PLAYERS) {
                let combinedPlayerArea = new Set();
                if (player.pieces.length > 0) {
                    player.pieces.forEach(p => {
                        const pieceArea = getAreaForPlayer(p.row, p.col, player.id, board);
                        pieceArea.forEach(cellString => combinedPlayerArea.add(cellString));
                    });
                }
                playerFinalAreas.push({ playerId: player.id, name: player.name, areaSet: combinedPlayerArea, cells: Array.from(combinedPlayerArea).map(s => {const [r,c] = s.split(','); return {r:parseInt(r),c:parseInt(c)};}), areaSize: combinedPlayerArea.size });
                
                // 영역 중복 체크 및 맵핑
                for (const cellString of combinedPlayerArea) {
                    if (occupiedByPlayerArea.has(cellString) && occupiedByPlayerArea.get(cellString) !== player.id) {
                        console.warn(`Overlapping area detected at ${cellString} between player ${occupiedByPlayerArea.get(cellString)} and ${player.id}. This shouldn't happen if pieces are trapped.`);
                        // 게임 종료 조건이 아님 (영역이 완전히 분리되지 않음)
                        // 이 경우, 아직 게임이 끝나지 않았다고 간주. (버그 또는 특수 상황)
                        return false; 
                    }
                    occupiedByPlayerArea.set(cellString, player.id);
                }
            }

            // 모든 빈 칸이 점유되었거나 중립인지 확인
            // (플레이어 말이 없는 빈칸은 어떤 플레이어의 영역에도 속하지 않아야 함. - 이미 getAreaForPlayer에서 처리됨)
            // 여기서는 모든 칸이 어떤 플레이어의 영역에 속하거나, 벽으로 둘러싸인 중립지역인지 확인.
            // 더 간단하게는, 모든 플레이어가 움직일 수 없는 상태에서, 각자의 영역이 확정되면 종료.

            console.log("All players cannot move. Calculating scores based on current areas.");
            calculateAndSetScores(playerFinalAreas); // playerFinalAreas는 [{playerId, name, cells, areaSize, areaSet}, ...]
            return true;
        }
        
        // TODO: "벽 부수기를 사용하지 않은 플레이어가 있더라도 게임은 종료된다."는 규칙은
        //       위의 canAnyPlayerMove 체크 시 벽 부수기 가능성은 고려하지 않아야 함을 의미. (현재 그렇게 동작)

        return false; 
    }

    let playerScores = [];

    function calculateAndSetScores(playerAreaInfos) {
        playerScores = [];
        for (const areaInfo of playerAreaInfos) {
            // areaInfo: { playerId, name, cells, areaSize, areaSet }
            const player = PLAYERS.find(p => p.id === areaInfo.playerId);
            let largestSingleConnectedArea = 0;

            if (areaInfo.areaSet.size > 0) {
                // 플레이어의 각 말에서 시작하여 가장 큰 단일 연결 영역 찾기
                // 이때, 다른 플레이어의 말/영역은 장애물로 간주해야 함.
                // getAreaForPlayer는 이미 이를 고려하여 해당 플레이어의 순수 영역을 계산.
                // 한 플레이어의 영역이 여러 조각으로 나뉠 수 있음.
                // 그 중 가장 큰 조각을 찾아야 함.
                
                const visitedForSingleArea = new Set();
                for (const cellStr of areaInfo.areaSet) {
                    if (!visitedForSingleArea.has(cellStr)) {
                        const [startR, startC] = cellStr.split(',').map(Number);
                        // 해당 셀이 areaInfo.areaSet (플레이어의 전체 영역)에 속하는지 확인하며 BFS
                        const q = [[startR, startC]];
                        const currentSingleArea = new Set();
                        visitedForSingleArea.add(cellStr);
                        currentSingleArea.add(cellStr);

                        while(q.length > 0) {
                            const [r, c] = q.shift();
                            const directions = [
                                { dr: -1, dc: 0 }, { dr: 1, dc: 0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 }
                            ];
                            for (const dir of directions) {
                                const nr = r + dir.dr;
                                const nc = c + dir.dc;
                                const neighborCellStr = `${nr},${nc}`;
                                if (areaInfo.areaSet.has(neighborCellStr) && !visitedForSingleArea.has(neighborCellStr)) {
                                     // isWallObstructing은 여기서 다시 체크할 필요 없음. areaInfo.areaSet이 이미 벽을 고려함.
                                    visitedForSingleArea.add(neighborCellStr);
                                    currentSingleArea.add(neighborCellStr);
                                    q.push([nr, nc]);
                                }
                            }
                        }
                        if (currentSingleArea.size > largestSingleConnectedArea) {
                            largestSingleConnectedArea = currentSingleArea.size;
                        }
                    }
                }
            }

            playerScores.push({
                id: player.id,
                name: player.name,
                totalArea: areaInfo.areaSize,
                largestSingleArea: largestSingleConnectedArea
            });
        }

        playerScores.sort((a, b) => {
            if (b.totalArea !== a.totalArea) {
                return b.totalArea - a.totalArea;
            }
            return b.largestSingleArea - a.largestSingleArea;
        });
        console.log("Final Player Scores:", playerScores);
    }

    function endGame() {
        clearInterval(timerInterval);
        displayMessage("게임 종료!", 'success', 0);
        let resultText = "게임 결과:\n";
        playerScores.forEach((score, index) => {
            resultText += `${index + 1}위: ${score.name} - 총 영역: ${score.totalArea} (가장 큰 단일 영역: ${score.largestSingleArea})\n`;
        });
        const gameInfoDiv = document.getElementById('game-info');
        
        // 이전 결과 및 재시작 버튼 제거 (중복 방지)
        const oldResultDiv = gameInfoDiv.querySelector('div#game-result-display');
        if(oldResultDiv) gameInfoDiv.removeChild(oldResultDiv);
        const oldRestartButton = gameInfoDiv.querySelector('button#restart-game-btn');
        if(oldRestartButton) gameInfoDiv.removeChild(oldRestartButton);

        const resultDiv = document.createElement('div');
        resultDiv.id = "game-result-display";
        resultDiv.innerHTML = `<h2>게임 결과</h2><pre>${resultText}</pre>`;
        gameInfoDiv.appendChild(resultDiv);

        const restartButton = document.createElement('button');
        restartButton.id = "restart-game-btn";
        restartButton.textContent = "게임 재시작";
        restartButton.addEventListener('click', initGame);
        gameInfoDiv.appendChild(restartButton);
        
        boardElement.style.pointerEvents = 'none'; 
        confirmationArea.innerHTML = ''; // 게임 종료 시 확인 버튼 영역 초기화
    }

    initGame();
}); 