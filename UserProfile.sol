// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title UserProfile
 * @dev Kontrak ini bertugas sebagai "buku indeks" on-chain.
 * Ia memetakan alamat pengguna (address) ke sebuah Content Identifier (CID)
 * dari IPFS. CID ini menunjuk ke satu file JSON yang berisi *semua*
 * data dasbor pengguna (profil, proyek, aktivitas).
 */
contract UserProfile {

    // "Database" on-chain kita.
    // Memetakan alamat wallet -> string (IPFS CID)
    mapping(address => string) public userProfileCIDs;

    /**
     * @dev Event yang dipancarkan (emit) setiap kali data profil diperbarui.
     * Ini sangat berguna untuk melacak perubahan atau untuk
     * layanan pengindeksan (seperti The Graph) di masa depan.
     */
    event ProfileUpdated(address indexed user, string newCID);

    /**
     * @dev Mengatur atau memperbarui CID profil untuk pengguna yang memanggil.
     * 'msg.sender' adalah alamat wallet yang terhubung
     * yang memanggil fungsi ini.
     * Ini memastikan bahwa HANYA pemilik wallet yang dapat
     * memperbarui data mereka sendiri.
     * @param _cid String CID baru dari IPFS.
     */
    function setProfileCID(string memory _cid) public {
        // Perbarui data di mapping
        userProfileCIDs[msg.sender] = _cid;
        
        // Pancarkan event untuk memberi tahu dunia luar
        emit ProfileUpdated(msg.sender, _cid);
    }

    /**
     * @dev Fungsi baca (read-only) publik untuk mendapatkan CID.
     * Meskipun mapping 'userProfileCIDs' sudah public,
     * memiliki getter eksplisit bisa lebih jelas.
     * Ini adalah fungsi 'view' (gratis untuk dipanggil).
     */
    function getProfileCID(address _user) public view returns (string memory) {
        return userProfileCIDs[_user];
    }
}