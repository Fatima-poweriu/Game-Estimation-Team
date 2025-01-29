<?php
$cardsFile = 'cards.json';

// Karten abrufen
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!file_exists($cardsFile)) {
        file_put_contents($cardsFile, json_encode([]));
    }
    echo file_get_contents($cardsFile);
    exit;
}

// Karten speichern
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = file_get_contents('php://input');
    file_put_contents($cardsFile, $data);
    echo json_encode(["status" => "success"]);
    exit;
}
?>