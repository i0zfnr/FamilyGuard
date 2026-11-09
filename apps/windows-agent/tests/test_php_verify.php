<?php
$pem = shell_exec('C:\laragon\www\FamilyGuard\apps\windows-agent\bin\XennGuardAgent.exe --pubkey');
$k = openssl_pkey_get_public($pem);
if (!$k) {
    echo "ERROR: openssl_pkey_get_public returned false\n";
    exit(1);
}
$d = openssl_pkey_get_details($k);
echo "OPENSSL KEY VERIFICATION: SUCCESS!\n";
echo "Key type: " . ($d['type'] === OPENSSL_KEYTYPE_RSA ? "RSA" : "OTHER") . "\n";
echo "Bits: " . $d['bits'] . "\n";
