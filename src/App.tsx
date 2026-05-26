import { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingCart, 
  Utensils, 
  Coffee, 
  ShoppingBag, 
  X, 
  Plus, 
  Minus, 
  Search, 
  Database, 
  Settings, 
  CheckCircle, 
  RefreshCw, 
  FileCode, 
  Trash2, 
  Printer, 
  ChevronRight, 
  AlertCircle, 
  Sparkles,
  Info,
  DollarSign,
  Download,
  Check,
  History,
  TrendingUp,
  Copy,
  Calendar,
  Coins,
  QrCode,
  Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, CartItem, TransactionPayload } from './types';
import { INITIAL_PRODUCTS, getProductPlaceholderImage } from './data';

export default function App() {
  // POS States
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('kntn_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });
  
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('kntn_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [backendUrl, setBackendUrl] = useState<string>(() => {
    const saved = localStorage.getItem('kntn_backend_url');
    const oldUrl1 = 'https://script.google.com/macros/s/AKfycbxhZKxVjsKqt0XbJUpQCav1FFmHhLYLVYWNtNlmCOtebUtT3m07Zfi3adAySfW6UR4A/exec';
    const oldUrl2 = 'https://script.google.com/macros/s/AKfycbkmRG4usRZXsvCd_lTBs8DeukKhrDtV8_Q8gMYi_IggSbbXPsHbx3SJDKY3gjNLnl/exec';
    const oldUrl3 = 'https://script.google.com/macros/s/AKfycbxbkmRG4usRZXsvCd_lTBs8DeukKhrDtV8_Q8gMYi_IggSbbXPsHbx3SJDKY3gjNLnl/exec';
    const oldUrl4 = 'https://script.google.com/macros/s/AKfycbwDiJIJEX4eNq_OltvqvNw7FBaELGOQbwcBuXYxE4im2UYCjxmPosJsFmhGqSJGvwar/exec';
    const newUrl = 'https://script.google.com/macros/s/AKfycbwpF0r51WTJNcZ041Zja9Mp6toGI1HF4IdTg-PvjSYX0xxbnfYv7pfFFU-Dk1Y0RS0uAg/exec';
    
    if (!saved || saved === oldUrl1 || saved === oldUrl2 || saved === oldUrl3 || saved === oldUrl4) {
      localStorage.setItem('kntn_backend_url', newUrl);
      return newUrl;
    }
    return saved;
  });

  const [category, setCategory] = useState<'Semua' | 'Makanan' | 'Minuman' | 'Jajanan'>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [nominalBayar, setNominalBayar] = useState<number | ''>('');
  const [isFetchLoading, setIsFetchLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [activeTab, setActiveTab ] = useState<'home' | 'pos' | 'panduan' | 'transactions'>('home');
  const [copiedScript, setCopiedScript] = useState(false);

  // Keep track of latest transaction for receipt printout
  const [metodePembayaran, setMetodePembayaran] = useState<string>('Tunai');

  const [latestTransaction, setLatestTransaction] = useState<{
    id_transaksi: string;
    tanggal: string;
    total_harga: number;
    nominal_bayar: number;
    kembalian: number;
    metode: string;
    keranjang: CartItem[];
  } | null>(null);

  // All transactions history log
  const [transactions, setTransactions] = useState<{
    id_transaksi: string;
    tanggal: string;
    total_harga: number;
    nominal_bayar: number;
    kembalian: number;
    metode: string;
    keranjang: CartItem[];
  }[]>(() => {
    const saved = localStorage.getItem('kntn_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  // Transaction history filter states
  const [txSearchQuery, setTxSearchQuery] = useState('');
  const [txFilterDate, setTxFilterDate] = useState<'Semua' | 'Hari Ini'>('Semua');

  // Persist values to localStorage
  useEffect(() => {
    localStorage.setItem('kntn_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('kntn_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('kntn_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Fetch products from Google Apps Script Web App
  const fetchProductsFromUrl = async (urlStr: string) => {
    if (!urlStr) return;
    setIsFetchLoading(true);
    setErrorMessage(null);
    try {
      const cleanUrl = urlStr.trim();
      const delimiter = cleanUrl.includes('?') ? '&' : '?';
      const targetUrl = `${cleanUrl}${delimiter}action=getProduk`;
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(targetUrl)}`;
      
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        try {
          const errData = await response.json();
          if (errData && errData.message) {
            throw new Error(errData.message);
          }
        } catch {
          // Fallback to standard status error
        }
        throw new Error(`HTTP Error status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result && result.status === 'SUCCESS' && Array.isArray(result.data)) {
        if (result.data.length > 0) {
          // Format keys if they differ
          const formatted: Product[] = result.data.map((item: any) => ({
            id_produk: String(item.id_produk || item.id || Math.random()),
            nama_produk: String(item.nama_produk || item.nama || 'Produk Tanpa Nama'),
            harga: Number(item.harga || 0),
            kategori: (item.kategori === 'Makanan' || item.kategori === 'Minuman' || item.kategori === 'Jajanan') 
              ? item.kategori 
              : 'Makanan',
            foto_drive_id: item.foto_drive_id || item.drive_id || ''
          }));
          setProducts(formatted);
          setSuccessMessage('Berhasil mensinkronisasi data produk dari server!');
          setTimeout(() => setSuccessMessage(null), 3000);
        } else {
          setErrorMessage('Koneksi berhasil, tetapi spreadsheet tidak mengembalikan data produk.');
        }
      } else {
        setErrorMessage(result.message || 'Format data dari server tidak dikenal (harus berupa {status: "SUCCESS", data: []})');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Gagal mengambil data dari Google Apps Script: ${err.message || err}. Menjalankan mode offline.`);
    } finally {
      setIsFetchLoading(false);
    }
  };

  // Run initial fetch on mount if URL exists
  useEffect(() => {
    if (backendUrl) {
      fetchProductsFromUrl(backendUrl);
    }
  }, []);

  // Save backend URL setting
  const handleSaveBackendUrl = (url: string) => {
    const cleanUrl = url.trim();
    setBackendUrl(cleanUrl);
    localStorage.setItem('kntn_backend_url', cleanUrl);
    if (cleanUrl) {
      fetchProductsFromUrl(cleanUrl);
    } else {
      // If cleared, reset to initial simulation products
      setProducts(INITIAL_PRODUCTS);
      setSuccessMessage('Backend dicopot. Kembali menggunakan data demo offline.');
      setTimeout(() => setSuccessMessage(null), 3500);
    }
  };

  // Categorize counts
  const categoryCounts = useMemo(() => {
    const counts = { Semua: products.length, Makanan: 0, Minuman: 0, Jajanan: 0 };
    products.forEach(p => {
      if (p.kategori in counts) {
        counts[p.kategori]++;
      }
    });
    return counts;
  }, [products]);

  // Filter products based on category and query searching
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCategory = category === 'Semua' || p.kategori === category;
      const matchSearch = p.nama_produk.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.id_produk.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [products, category, searchQuery]);

  // Filter transaction records
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      let matchDate = true;
      if (txFilterDate === 'Hari Ini') {
        const todayObj = new Date();
        const curDay = todayObj.getDate();
        const curMonth = todayObj.getMonth();
        const curYear = todayObj.getFullYear();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const formatString = `${curDay} ${monthNames[curMonth]} ${curYear}`;
        matchDate = tx.tanggal.toLowerCase().includes(formatString.toLowerCase());
      }

      const query = txSearchQuery.toLowerCase().trim();
      const matchSearch = !query || 
        tx.id_transaksi.toLowerCase().includes(query) ||
        tx.keranjang.some(item => item.nama_produk.toLowerCase().includes(query));

      return matchDate && matchSearch;
    });
  }, [transactions, txFilterDate, txSearchQuery]);

  // Metrics definitions
  const totalRevenue = useMemo(() => {
    return filteredTransactions.reduce((sum, tx) => sum + tx.total_harga, 0);
  }, [filteredTransactions]);

  const totalTxCount = filteredTransactions.length;

  const averageBasket = useMemo(() => {
    if (totalTxCount === 0) return 0;
    return Math.round(totalRevenue / totalTxCount);
  }, [totalRevenue, totalTxCount]);

  const totalQtySold = useMemo(() => {
    return filteredTransactions.reduce((sum, tx) => 
      sum + tx.keranjang.reduce((s, item) => s + item.qty, 0)
    , 0);
  }, [filteredTransactions]);

  // Deletion individual handler
  const handleDeleteTx = (id: string) => {
    if (window.confirm(`Hapus transaksi ${id} dari pencatatan browser lokal?`)) {
      setTransactions(prev => prev.filter(t => t.id_transaksi !== id));
      setSuccessMessage('Sukses menghapus entri transaksi tersebut.');
      setTimeout(() => setSuccessMessage(null), 2500);
    }
  };

  // Bulk flush handler
  const handleResetTxHistory = () => {
    if (window.confirm('PERINGATAN! Anda akan menghapus SELURUH riwayat transaksi dari penyimpanan browser Anda secara permanen. Tindakan ini tidak dapat dibatalkan. Lanjutkan?')) {
      setTransactions([]);
      setSuccessMessage('Seluruh riwayat transaksi lokal berhasil dibersihkan.');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  // Clipboard copy ID
  const handleCopyTxId = (id: string) => {
    navigator.clipboard.writeText(id);
    setSuccessMessage(`ID Transaksi ${id} disalin.`);
    setTimeout(() => setSuccessMessage(null), 2000);
  };

  // Excel CSV CSV Exporter
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      setErrorMessage('Tidak ada data transaksi untuk diekspor!');
      return;
    }
    
    // Header
    let csvContent = '\uFEFFID Transaksi,Tanggal,Metode Pembayaran,Total Belanja,Nominal Bayar,Kembalian,Daftar Item\n';
    
    // Rows
    filteredTransactions.forEach(tx => {
      const itemsStr = tx.keranjang.map(it => `${it.nama_produk} (${it.qty}x)`).join(' | ');
      const cleanedItemsStr = `"${itemsStr.replace(/"/g, '""')}"`;
      csvContent += `${tx.id_transaksi},${tx.tanggal},${tx.metode},${tx.total_harga},${tx.nominal_bayar},${tx.kembalian},${cleanedItemsStr}\n`;
    });
    
    // Download trigger
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_Transaksi_Kantin_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setSuccessMessage('Sukses mendownload spreadsheet transaksi CSV!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Cart operations
  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id_produk === product.id_produk);
      if (existing) {
        return prev.map(item => 
          item.id_produk === product.id_produk 
            ? { ...item, qty: item.qty + 1 } 
            : item
        );
      }
      return [...prev, {
        id_produk: product.id_produk,
        nama_produk: product.nama_produk,
        harga: product.harga,
        qty: 1
      }];
    });
  };

  const handleUpdateQty = (id: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id_produk === id) {
          const newQty = item.qty + delta;
          return { ...item, qty: newQty };
        }
        return item;
      }).filter(item => item.qty > 0);
    });
  };

  const handleClearCart = () => {
    if (window.confirm('Apakah Anda yakin ingin mengosongkan seluruh keranjang belanja?')) {
      setCart([]);
      setNominalBayar('');
    }
  };

  // Totals calculations
  const totalHarga = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.harga * item.qty), 0);
  }, [cart]);

  const kembalian = useMemo(() => {
    if (nominalBayar === '' || nominalBayar < totalHarga) return 0;
    return nominalBayar - totalHarga;
  }, [nominalBayar, totalHarga]);

  // Quick amounts
  const handleQuickAmount = (amount: number) => {
    setNominalBayar(amount);
  };

  // Auto Greeting based on Indonesian hours
  const greetingText = useMemo(() => {
    const hours = new Date().getHours();
    if (hours >= 5 && hours < 11) return 'Selamat Pagi ☀️';
    if (hours >= 11 && hours < 15) return 'Selamat Siang 🌤️';
    if (hours >= 15 && hours < 18) return 'Selamat Sore ⛅';
    return 'Selamat Malam 🌙';
  }, []);

  // Format currency helpers Indo
  const formatRupiah = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  // Submit checkout
  const handleCheckout = async () => {
    // Basic validation
    if (cart.length === 0) {
      setErrorMessage('Keranjang belanja masih kosong!');
      return;
    }
    if (nominalBayar === '' || nominalBayar < totalHarga) {
      setErrorMessage(`Uang diterima tidak mencukupi! Minimal ${formatRupiah(totalHarga)}`);
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    // Generate accurate canteen transaction code
    const randDigits = Math.floor(1000 + Math.random() * 9000);
    const timestamp = Date.now().toString().slice(-6);
    const dateObj = new Date();
    const formattedDate = dateObj.getFullYear() +
      String(dateObj.getMonth() + 1).padStart(2, '0') +
      String(dateObj.getDate()).padStart(2, '0');
    const transactionId = `KNTN-${formattedDate}-${timestamp}-${randDigits}`;

    const payload: TransactionPayload = {
      action: 'simpanTransaksi',
      id_transaksi: transactionId,
      total_harga: totalHarga,
      nominal_bayar: Number(nominalBayar),
      kembalian: nominalBayar - totalHarga,
      metode: metodePembayaran,
      keranjang: cart
    };

    const transactionRecord = {
      ...payload,
      tanggal: dateObj.toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    };

    // If backend URL is defined, POST to Google Sheets backend
    if (backendUrl) {
      try {
        const response = await fetch('/api/proxy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url: backendUrl.trim(),
            ...payload
          })
        });

        const result = await response.json();
        
        if (result && result.status === 'SUCCESS') {
          setLatestTransaction(transactionRecord);
          setTransactions(prev => [transactionRecord, ...prev]);
          setShowReceipt(true);
          setCart([]);
          setNominalBayar('');
          setSuccessMessage('Koneksi sukses! Transaksi dicatat langsung ke Google Sheets.');
          setTimeout(() => setSuccessMessage(null), 3000);
        } else {
          setErrorMessage(result.message || 'Gagal menyimpan transaksi ke Google Sheets. Respons server tidak valid.');
        }
      } catch (err: any) {
        console.error(err);
        setErrorMessage(`Kesalahan jaringan APPS Script: ${err.message || err}. Namun, transaksi disimpan lokal.`);
        // Fallback save locally, allow receipt print
        setLatestTransaction(transactionRecord);
        setTransactions(prev => [transactionRecord, ...prev]);
        setShowReceipt(true);
        setCart([]);
        setNominalBayar('');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Simulated successful checkout in offline mode
      setTimeout(() => {
        setLatestTransaction(transactionRecord);
        setTransactions(prev => [transactionRecord, ...prev]);
        setShowReceipt(true);
        setCart([]);
        setNominalBayar('');
        setIsSubmitting(false);
        setSuccessMessage('Transaksi Sukses! (Mode Simulasi Offline)');
        setTimeout(() => setSuccessMessage(null), 3000);
      }, 800);
    }
  };

  // Google Apps Script source code
  const appsScriptCode = `// KODE BACKEND GOOGLE APPS SCRIPT (KANTIN SEKOLAH)
// Tempelkan kode ini di Extensions > Apps Script pada Spreadsheet Anda.

function doGet(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Buat sheet "Produk" jika belum ada
  let sheetProduk = ss.getSheetByName("Produk");
  if (!sheetProduk) {
    sheetProduk = ss.insertSheet("Produk");
    sheetProduk.appendRow(["id_produk", "nama_produk", "harga", "kategori", "foto_drive_id"]);
    sheetProduk.appendRow(["P001", "Nasi Goreng Spesial + Telor", 15000, "Makanan", ""]);
    sheetProduk.appendRow(["P002", "Mie Ayam Bakso Pangsit", 12000, "Makanan", ""]);
    sheetProduk.appendRow(["P006", "Es Teh Manis Jumbo", 3000, "Minuman", ""]);
    sheetProduk.appendRow(["P011", "Roti Bakar Cokelat Keju Sapi", 8000, "Jajanan", ""]);
  }

  if (action === "getProduk") {
    const data = sheetProduk.getDataRange().getValues();
    const headers = data[0];
    const result = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const obj = {};
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = row[j];
      }
      result.push(obj);
    }
    return ContentService.createTextOutput(JSON.stringify({ status: "SUCCESS", data: result }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.action === "simpanTransaksi") {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheetTransaksi = ss.getSheetByName("Transaksi");
      if (!sheetTransaksi) {
        sheetTransaksi = ss.insertSheet("Transaksi");
        sheetTransaksi.appendRow(["id_transaksi", "tanggal", "total_harga", "nominal_bayar", "kembalian", "metode", "item_list"]);
      }
      
      const itemFormatted = data.keranjang.map(it => \`\${it.nama_produk} (qty: \${it.qty}, harga: \${it.harga})\`).join(" | ");
      
      sheetTransaksi.appendRow([
        data.id_transaksi,
        new Date().toLocaleString("id-ID"),
        data.total_harga,
        data.nominal_bayar,
        data.kembalian,
        data.metode,
        itemFormatted
      ]);
      
      return ContentService.createTextOutput(JSON.stringify({ status: "SUCCESS", message: "Transaksi berhasil disimpan!" }))
                           .setMimeType(ContentService.MimeType.JSON);
    }
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "ERROR", message: err.message }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  // Copy helper
  const handleCopyScript = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  // Generate Standalone HTML single-file download
  const handleDownloadStandaloneHtml = () => {
    const defaultUrl = backendUrl || 'MASUKKAN_URL_APPS_SCRIPT_ANDA_DISINI';
    
    // String template for pure single file output
    const rawHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kasir Kantin Sekolah - POS</title>
  <!-- Tailwind CSS via Play CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Google Fonts Outfit & Inter -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <!-- Lucide Icons CDN -->
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    body {
      font-family: 'Inter', sans-serif;
      background-color: #f8fafc;
    }
    h1, h2, h3, h4, .font-display {
      font-family: 'Outfit', sans-serif;
    }
    /* Scrollbar Style */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 9999px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen flex flex-col">

  <!-- TOP HEADER -->
  <header class="bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
      <div class="flex items-center gap-3">
        <div class="bg-white/20 p-2.5 rounded-xl backdrop-blur-md border border-white/20">
          <i data-lucide="store" class="w-7 h-7 text-white"></i>
        </div>
        <div>
          <h1 class="text-2xl font-bold tracking-tight">Kantin POS</h1>
          <p class="text-xs text-amber-100 font-medium">Sistem Kasir Kantin Sekolah Standalone</p>
        </div>
      </div>
      
      <!-- Backend Status and Settings -->
      <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
        <div id="backend-indicator" class="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/20 border border-emerald-400/30 text-white">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span id="backend-status-text">Mode Offline / Demo</span>
        </div>
        
        <button onclick="toggleConfigModal()" class="bg-white/20 hover:bg-white/30 text-white px-3.5 py-2 rounded-xl transition duration-200 flex items-center gap-2 text-sm font-medium border border-white/10 select-none">
          <i data-lucide="settings" class="w-4 h-4"></i>
          <span>Ubah URL Backend</span>
        </button>
      </div>
    </div>
  </header>

  <!-- APP CONTENT -->
  <main class="max-w-7xl mx-auto px-4 md:px-6 py-6 flex-grow w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
    
    <!-- LEFT COLUMN: CATEGORIES & PRODUCT GRID (60% width) -->
    <section class="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
      
      <!-- Search & Greeting -->
      <div class="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div class="w-full sm:w-auto">
          <p class="text-xs text-slate-400 font-semibold uppercase tracking-wider">Selamat Datang Petugas Kantin</p>
          <h2 id="greeting-title" class="text-xl font-bold text-slate-800">Semoga harimu menyenangkan! 😊</h2>
        </div>
        
        <!-- Search field -->
        <div class="relative w-full sm:w-72">
          <input type="text" id="search-input" oninput="filterAndRenderProducts()" placeholder="Cari nama makan atau id..." class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm placeholder-slate-400 transition-all">
          <div class="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none">
            <i data-lucide="search" class="w-4 h-4"></i>
          </div>
        </div>
      </div>

      <!-- Category Filter Tabs -->
      <div class="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex gap-2 overflow-x-auto">
        <button id="tab-all" onclick="setCategoryFilter('Semua')" class="px-5 py-3 rounded-xl font-semibold text-sm transition-all whitespace-nowrap bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/10">
          Semua <span id="count-all" class="ml-1 bg-white/20 text-white text-xs px-2 py-0.5 rounded-md font-bold">15</span>
        </button>
        <button id="tab-makanan" onclick="setCategoryFilter('Makanan')" class="px-5 py-3 rounded-xl font-semibold text-sm transition-all text-slate-600 hover:bg-slate-50 whitespace-nowrap">
          🍽️ Makanan <span id="count-makanan" class="ml-1 bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-md font-bold">5</span>
        </button>
        <button id="tab-minuman" onclick="setCategoryFilter('Minuman')" class="px-5 py-3 rounded-xl font-semibold text-sm transition-all text-slate-600 hover:bg-slate-50 whitespace-nowrap">
          🥤 Minuman <span id="count-minuman" class="ml-1 bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-md font-bold">5</span>
        </button>
        <button id="tab-jajanan" onclick="setCategoryFilter('Jajanan')" class="px-5 py-3 rounded-xl font-semibold text-sm transition-all text-slate-600 hover:bg-slate-50 whitespace-nowrap">
          🍿 Jajanan <span id="count-jajanan" class="ml-1 bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-md font-bold">5</span>
        </button>
      </div>

      <!-- PRODUCTS GRID -->
      <div id="loading-spinner" class="hidden flex flex-col justify-center items-center py-20 bg-white/60 rounded-3xl border border-slate-100">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent shadow-sm"></div>
        <p class="text-sm font-semibold text-slate-500 mt-4">Mensinkronisasi menu dari Google Sheets...</p>
      </div>

      <div id="products-grid" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        <!-- Products cards are dynamically injected here -->
      </div>
      
    </section>

    <!-- RIGHT COLUMN: SHOPPING CART (sticky 40% width) -->
    <section class="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24 max-h-[calc(100vh-120px)] flex flex-col">
      <div class="bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
        
        <!-- Cart Header -->
        <div class="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div class="flex items-center gap-2">
            <i data-lucide="shopping-cart" class="w-5 h-5 text-orange-600"></i>
            <h3 class="text-lg font-bold text-slate-800">Keranjang Belanja</h3>
          </div>
          <button onclick="clearCart()" class="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-xl transition duration-150 select-none">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            <span>Kosongkan</span>
          </button>
        </div>

        <!-- Cart Items List (Scrollable) -->
        <div id="cart-items" class="p-5 overflow-y-auto space-y-4 max-h-[280px] min-h-[140px] flex-grow">
          <!-- Cart items injected here -->
        </div>

        <!-- Total of goods -->
        <div class="p-5 bg-slate-50 border-t border-slate-100 space-y-4">
          <div class="flex justify-between items-center">
            <span class="text-sm text-slate-500 font-semibold">Total Belanja</span>
            <span id="total-price" class="text-2xl font-bold text-slate-800 font-display">Rp 0</span>
          </div>

          <!-- Quick Pay Suggestions for schoolchildren -->
          <div class="space-y-2">
            <div class="text-xs text-slate-400 font-bold uppercase tracking-wider">Uang Pas Anak Sekolah (Cepat)</div>
            <div class="grid grid-cols-4 gap-2">
              <button onclick="setNominalBayar(5000)" class="py-2 px-1 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold transition border border-orange-200/50">5K</button>
              <button onclick="setNominalBayar(10000)" class="py-2 px-1 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold transition border border-orange-200/50">10K</button>
              <button onclick="setNominalBayar(20000)" class="py-2 px-1 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold transition border border-orange-200/50">20K</button>
              <button onclick="setNominalBayar(50000)" class="py-2 px-1 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold transition border border-orange-200/50">50K</button>
            </div>
          </div>

          <!-- Cash Received and Change logic -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="cash-input" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Uang Diterima</label>
              <div class="relative">
                <span class="absolute left-3 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                <input type="number" id="cash-input" oninput="calculateChange()" placeholder="0" class="w-full pl-8 pr-2.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-semibold">
              </div>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kembalian</label>
              <div id="change-display" class="py-2.5 px-3 rounded-xl bg-slate-100 border border-slate-200/50 text-slate-600 font-bold text-sm">
                Rp 0
              </div>
            </div>
          </div>

          <div id="alert-error" class="hidden p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <i data-lucide="alert-circle" class="w-4 h-4 flex-shrink-0"></i>
            <span id="alert-error-text">Mohon maaf terjadi kesalahan!</span>
          </div>

          <div id="alert-success" class="hidden p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2">
            <i data-lucide="check" class="w-4 h-4 flex-shrink-0"></i>
            <span id="alert-success-text">Operasi Berhasil!</span>
          </div>

          <!-- Checkout Action -->
          <button id="checkout-button" onclick="submitTransaction()" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold transition shadow-lg shadow-orange-500/20 active:scale-[0.98] select-none flex justify-center items-center gap-2 text-base">
            <i data-lucide="shopping-bag" class="w-5 h-5"></i>
            <span>Selesaikan Transaksi</span>
          </button>
        </div>

      </div>
    </section>
  </main>

  <!-- URL BACKEND SETTINGS MODAL -->
  <dialog id="config-modal" class="bg-black/40 backdrop-blur-sm fixed inset-0 w-full h-full z-50 flex items-center justify-center p-4 hidden">
    <div class="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 relative">
      <button onclick="toggleConfigModal()" class="absolute right-5 top-5 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition">
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>

      <div class="flex items-center gap-3 mb-4">
        <div class="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
          <i data-lucide="database" class="w-6 h-6"></i>
        </div>
        <div>
          <h3 class="text-xl font-bold text-slate-850">Ganti Google Apps Script</h3>
          <p class="text-xs text-slate-400">Atur database & sinkronisasi Google Sheets</p>
        </div>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-semibold text-slate-700 mb-1.5">URL Google Apps Script Web App</label>
          <input type="text" id="backend-url-input" placeholder="https://script.google.com/macros/s/.../exec" class="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none">
          <p class="text-[11px] text-slate-400 mt-1.5">Masukkan tautan "Web App URL" yang Anda dapat setelah men-deploy Google Apps Script milik Anda.</p>
        </div>

        <div class="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-4 flex gap-3 text-amber-800 text-xs">
          <i data-lucide="info" class="w-5 h-5 text-amber-600 flex-shrink-0"></i>
          <div>
            <span class="font-bold block">Bagaimana Cara Kerjanya?</span>
            Aplikasi ini akan mem-fetch daftar produk (<code class="bg-amber-100 px-1 rounded">getProduk</code>) dan menyimpan transaksi (<code class="bg-amber-100 px-1 rounded">simpanTransaksi</code>) secara langsung ke Google Sheets tanpa perantara server backend luar!
          </div>
        </div>

        <div class="flex gap-3 pt-2">
          <button onclick="saveBackendConfiguration()" class="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-xl text-sm transition">
            Simpan & Sinkronkan
          </button>
          <button onclick="clearBackendConfiguration()" class="bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-3 px-4 rounded-xl text-sm transition">
            Disconnect
          </button>
        </div>
      </div>
    </div>
  </dialog>

  <!-- RECEIPT OVERLAY MODAL -->
  <dialog id="receipt-modal" class="bg-black/50 backdrop-blur-sm fixed inset-0 w-full h-full z-50 flex items-center justify-center p-4 hidden">
    <div class="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 relative">
      <button onclick="toggleReceiptModal()" class="absolute right-5 top-5 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition">
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>

      <!-- Receipt Content Box -->
      <div id="receipt-print-area" class="border border-slate-100 rounded-2xl p-5 bg-amber-50/10 font-mono text-xs">
        <div class="text-center pb-4 border-b border-dashed border-slate-200 space-y-1">
          <h4 class="text-base font-bold text-slate-800 uppercase tracking-tight font-display">Kantin Sekolah POS</h4>
          <p class="text-[10px] text-slate-400">SDN Harapan & Cita-Cita</p>
          <p class="text-[9px] text-slate-400">Jl. Ceria Anak Bangsa No. 12</p>
        </div>

        <div class="py-3 border-b border-dashed border-slate-200 space-y-1 text-slate-500 text-[10px]">
          <div class="flex justify-between">
            <span>NO TRANS:</span>
            <span id="receipt-id" class="font-bold text-slate-700">KNTN-...</span>
          </div>
          <div class="flex justify-between">
            <span>TANGGAL:</span>
            <span id="receipt-date">26-05-2026 12:00</span>
          </div>
          <div class="flex justify-between">
            <span>KASIR:</span>
            <span>Petugas Kantin</span>
          </div>
          <div class="flex justify-between">
            <span>PAYMENT:</span>
            <span>TUNAI</span>
          </div>
        </div>

        <!-- Receipt items list -->
        <div id="receipt-items-list" class="py-3 border-b border-dashed border-slate-200 space-y-1.5 text-slate-600">
          <!-- Dynamically injected items -->
        </div>

        <!-- Calculations -->
        <div class="py-3 space-y-1">
          <div class="flex justify-between font-bold text-slate-800">
            <span>TOTAL BELANJA:</span>
            <span id="receipt-total">Rp 0</span>
          </div>
          <div class="flex justify-between text-slate-500">
            <span>NOMINAL TUNAI:</span>
            <span id="receipt-cash">Rp 0</span>
          </div>
          <div class="flex justify-between font-bold text-orange-600">
            <span>KEMBALIAN:</span>
            <span id="receipt-change">Rp 0</span>
          </div>
        </div>

        <div class="pt-4 border-t border-dashed border-slate-200 text-center text-slate-400 text-[9px] space-y-0.5">
          <p class="font-bold text-slate-600 font-display text-xs">Terima Kasih Banyak!</p>
          <p>Jangan lupa buang sampah pada tempatnya ya!</p>
          <p>Selamat menikmati makanan sehatmu.</p>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="flex gap-3 mt-5">
        <button onclick="window.print()" class="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-xl text-sm transition flex justify-center items-center gap-2 select-none">
          <i data-lucide="printer" class="w-4 h-4"></i>
          <span>Cetak Struk POS</span>
        </button>
        <button onclick="toggleReceiptModal()" class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-3 px-4 rounded-xl text-sm transition text-center select-none">
          Tutup
        </button>
      </div>
    </div>
  </dialog>

  <!-- JAVASCRIPT POS SYSTEM -->
  <script>
    // INITIAL PRODUCTS DATA SEED fallback
    const MOCK_PRODUCTS = [
      { id_produk: "P001", nama_produk: "Nasi Goreng Spesial + Telor", harga: 15000, kategori: "Makanan", foto_drive_id: "" },
      { id_produk: "P002", nama_produk: "Mie Ayam Bakso Pangsit", harga: 12000, kategori: "Makanan", foto_drive_id: "" },
      { id_produk: "P003", nama_produk: "Bakso Sapi Urat Premium", harga: 13000, kategori: "Makanan", foto_drive_id: "" },
      { id_produk: "P004", nama_produk: "Ayam Goreng Penyet Kremes", harga: 14000, kategori: "Makanan", foto_drive_id: "" },
      { id_produk: "P005", nama_produk: "Nasi Kuning Komplit", harga: 10000, kategori: "Makanan", foto_drive_id: "" },
      { id_produk: "P006", nama_produk: "Es Teh Manis Jumbo", harga: 3000, kategori: "Minuman", foto_drive_id: "" },
      { id_produk: "P007", nama_produk: "Jus Alpukat Margarin Segar", harga: 7000, kategori: "Minuman", foto_drive_id: "" },
      { id_produk: "P008", nama_produk: "Susu Cokelat Dingin UHT", harga: 5000, kategori: "Minuman", foto_drive_id: "" },
      { id_produk: "P009", nama_produk: "Es Jeruk Kunci Peras", harga: 4000, kategori: "Minuman", foto_drive_id: "" },
      { id_produk: "P010", nama_produk: "Teh Tarik Aceh Ice", harga: 6000, kategori: "Minuman", foto_drive_id: "" },
      { id_produk: "P011", nama_produk: "Roti Bakar Cokelat Keju Sapi", harga: 8000, kategori: "Jajanan", foto_drive_id: "" },
      { id_produk: "P012", nama_produk: "Batagor Crispy Bandung", harga: 6000, kategori: "Jajanan", foto_drive_id: "" },
      { id_produk: "P013", nama_produk: "Pisang Goreng Madu Keju", harga: 5000, kategori: "Jajanan", foto_drive_id: "" },
      { id_produk: "P014", nama_produk: "Kentang Goreng Chili Powder", harga: 7000, kategori: "Jajanan", foto_drive_id: "" },
      { id_produk: "P015", nama_produk: "Cilok Bumbu Kacang Pedas", harga: 4000, kategori: "Jajanan", foto_drive_id: "" }
    ];

    const PLACEHOLDER_IMAGES = {
      P001: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80",
      P002: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80",
      P003: "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&w=600&q=80",
      P004: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80",
      P005: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80",
      P006: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80",
      P007: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80",
      P008: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80",
      P009: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=600&q=80",
      P010: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80",
      P011: "https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?auto=format&fit=crop&w=600&q=80",
      P012: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80",
      P013: "https://images.unsplash.com/photo-1566843972142-a7fcb70de55a?auto=format&fit=crop&w=600&q=80",
      P014: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80",
      P015: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80"
    };

    // State Variables
    let dataProduk = JSON.parse(localStorage.getItem('standalone_kntn_products')) || [...MOCK_PRODUCTS];
    let keranjang = JSON.parse(localStorage.getItem('standalone_kntn_cart')) || [];
    let stateCategory = 'Semua';
    let localBackendUrl = localStorage.getItem('standalone_kntn_backend_url') || '${defaultUrl}';

    // UI elements selector pointers
    const productsGrid = document.getElementById('products-grid');
    const cartItemsContainer = document.getElementById('cart-items');
    const totalPriceDisplay = document.getElementById('total-price');
    const cashInput = document.getElementById('cash-input');
    const changeDisplay = document.getElementById('change-display');
    const backendStatusText = document.getElementById('backend-status-text');
    const backendIndicator = document.getElementById('backend-indicator');

    // Load Greeting based on local Indonesian hour
    function updateGreeting() {
      const hours = new Date().getHours();
      let greet = 'Semoga harimu menyenangkan! 😊';
      if (hours >= 5 && hours < 11) greet = 'Selamat Pagi ☀️';
      else if (hours >= 11 && hours < 15) greet = 'Selamat Siang 🌤️';
      else if (hours >= 15 && hours < 18) greet = 'Selamat Sore ⛅';
      else greet = 'Selamat Malam 🌙';
      document.getElementById('greeting-title').innerText = greet;
    }

    // Helper currency formatting Indon
    function formatRupiahJs(num) {
      return 'Rp ' + num.toLocaleString('id-ID');
    }

    // Modal triggers
    function toggleConfigModal() {
      const modal = document.getElementById('config-modal');
      const input = document.getElementById('backend-url-input');
      input.value = localBackendUrl === 'MASUKKAN_URL_APPS_SCRIPT_ANDA_DISINI' ? '' : localBackendUrl;
      modal.classList.toggle('hidden');
    }

    function toggleReceiptModal() {
      document.getElementById('receipt-modal').classList.toggle('hidden');
    }

    function showAlert(type, message) {
      const alertId = type === 'success' ? 'alert-success' : 'alert-error';
      const textId = type === 'success' ? 'alert-success-text' : 'alert-error-text';
      const alertEl = document.getElementById(alertId);
      document.getElementById(textId).innerText = message;
      alertEl.classList.remove('hidden');
      setTimeout(() => alertEl.classList.add('hidden'), 4500);
    }

    // Save Backend Configuration
    function saveBackendConfiguration() {
      const inputVal = document.getElementById('backend-url-input').value.trim();
      if (!inputVal) {
        showAlert('error', 'Masukkan URL Web App Apps Script yang valid!');
        return;
      }
      localBackendUrl = inputVal;
      localStorage.setItem('standalone_kntn_backend_url', inputVal);
      toggleConfigModal();
      showAlert('success', 'Backend disimpan! Mensinkronisasi ulang...');
      fetchAndSyncProducts();
    }

    function clearBackendConfiguration() {
      localBackendUrl = 'MASUKKAN_URL_APPS_SCRIPT_ANDA_DISINI';
      localStorage.removeItem('standalone_kntn_backend_url');
      dataProduk = [...MOCK_PRODUCTS];
      localStorage.setItem('standalone_kntn_products', JSON.stringify(dataProduk));
      toggleConfigModal();
      updateBackendStatus(false);
      filterAndRenderProducts();
      showAlert('success', 'Berhasil memutuskan hubungan backend. Kembali ke Data Demo offline.');
    }

    // Update connection status bar
    function updateBackendStatus(connected, extraText = '') {
      if (connected) {
        backendIndicator.className = 'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500 hover:bg-emerald-650 text-white';
        backendStatusText.innerHTML = 'Connected to Spreadsheet ' + extraText;
      } else {
        backendIndicator.className = 'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-500/20 border border-slate-400/30 text-slate-700';
        backendStatusText.innerHTML = 'Mode Offline / Demo';
      }
    }

    // Fetch and sync products via Apps Script
    async function fetchAndSyncProducts() {
      if (!localBackendUrl || localBackendUrl === 'MASUKKAN_URL_APPS_SCRIPT_ANDA_DISINI') {
        updateBackendStatus(false);
        filterAndRenderProducts();
        return;
      }

      const spinner = document.getElementById('loading-spinner');
      productsGrid.classList.add('hidden');
      spinner.classList.remove('hidden');

      try {
        const delimiter = localBackendUrl.includes('?') ? '&' : '?';
        const targetUrl = localBackendUrl + delimiter + 'action=getProduk';
        const response = await fetch(targetUrl);
        if (!response.ok) throw new Error('Response HTTP error ' + response.status);
        const result = await response.json();
        
        if (result && result.status === 'SUCCESS' && Array.isArray(result.data)) {
          if (result.data.length > 0) {
            dataProduk = result.data.map(item => ({
              id_produk: item.id_produk || item.id || 'P' + Math.floor(Math.random() * 999),
              nama_produk: item.nama_produk || item.nama || 'Produk Baru',
              harga: Number(item.harga) || 0,
              kategori: ['Makanan', 'Minuman', 'Jajanan'].includes(item.kategori) ? item.kategori : 'Makanan',
              foto_drive_id: item.foto_drive_id || ''
            }));
            localStorage.setItem('standalone_kntn_products', JSON.stringify(dataProduk));
            updateBackendStatus(true, '(OK)');
            showAlert('success', 'Sinkronisasi menu berhasil!');
          }
        } else {
          throw new Error('Data tidak berada dalam format {status: "SUCCESS", data: []}');
        }
      } catch (e) {
        console.warn(e);
        updateBackendStatus(true, '(Fallback Offline)');
        showAlert('error', 'Koneksi error: ' + e.message + '. Menggunakan database lokal.');
      } finally {
        spinner.classList.add('hidden');
        productsGrid.classList.remove('hidden');
        filterAndRenderProducts();
      }
    }

    // Filter Products and Display
    function setCategoryFilter(cat) {
      stateCategory = cat;
      
      // Update Tab Button styles
      const categories = ['Semua', 'Makanan', 'Minuman', 'Jajanan'];
      categories.forEach(c => {
        const key = c.toLowerCase();
        const tabEl = document.getElementById('tab-' + key);
        if (c === cat) {
          tabEl.className = "px-5 py-3 rounded-xl font-semibold text-sm transition-all whitespace-nowrap bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/10";
        } else {
          tabEl.className = "px-5 py-3 rounded-xl font-semibold text-sm transition-all text-slate-600 hover:bg-slate-50 whitespace-nowrap";
        }
      });

      filterAndRenderProducts();
    }

    // Render grid cards dynamically
    function filterAndRenderProducts() {
      const q = document.getElementById('search-input').value.toLowerCase();
      
      // Compute counts
      const counts = { Semua: dataProduk.length, Makanan: 0, Minuman: 0, Jajanan: 0 };
      dataProduk.forEach(p => {
        if (p.kategori in counts) counts[p.kategori]++;
      });
      
      document.getElementById('count-all').innerText = counts.Semua;
      document.getElementById('count-makanan').innerText = counts.Makanan;
      document.getElementById('count-minuman').innerText = counts.Minuman;
      document.getElementById('count-jajanan').innerText = counts.Jajanan;

      // Filter products
      const filtered = dataProduk.filter(p => {
        const inCat = stateCategory === 'Semua' || p.kategori === stateCategory;
        const matchesQuery = p.nama_produk.toLowerCase().includes(q) || p.id_produk.toLowerCase().includes(q);
        return inCat && matchesQuery;
      });

      productsGrid.innerHTML = '';
      if (filtered.length === 0) {
        productsGrid.innerHTML = \`<div class="col-span-full py-16 text-center text-slate-400 bg-white border border-slate-100 rounded-3xl">
          <i data-lucide="info" class="w-10 h-10 mx-auto text-slate-300 mb-2"></i>
          <p class="font-bold text-slate-500 text-sm">Tidak Ada Item Ditemukan</p>
          <p class="text-xs text-slate-400">Silakan ubah kategori atau periksa ketikan pencarian anda.</p>
        </div>\`;
        lucide.createIcons();
        return;
      }

      filtered.forEach(p => {
        // Image resolve logic
        let imgSrc = '';
        if (p.foto_drive_id) {
          imgSrc = 'https://lh3.googleusercontent.com/d/' + p.foto_drive_id;
        } else {
          imgSrc = PLACEHOLDER_IMAGES[p.id_produk] || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80';
        }

        const card = document.createElement('div');
        card.className = "bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-slate-100 transition-all duration-200 cursor-pointer flex flex-col group active:scale-[0.98]";
        card.onclick = () => addToCart(p);
        card.innerHTML = \`
          <div class="h-40 w-full overflow-hidden bg-slate-100 relative">
            <img src="\${imgSrc}" alt="\${p.nama_produk}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer">
            <span class="absolute top-3 left-3 bg-white/95 text-slate-800 text-[10px] font-bold py-1 px-2.5 rounded-full uppercase tracking-wider backdrop-blur">
              \${p.kategori}
            </span>
          </div>
          <div class="p-4 flex-grow flex flex-col justify-between">
            <h4 class="font-bold text-slate-800 text-sm group-hover:text-amber-600 transition-colors line-clamp-2">\${p.nama_produk}</h4>
            <div class="flex justify-between items-center mt-3 pt-2 border-t border-slate-50">
              <span class="text-xs text-slate-400 font-bold">\${p.id_produk}</span>
              <span class="text-base font-extrabold text-orange-600">\${formatRupiahJs(p.harga)}</span>
            </div>
          </div>
        \`;
        productsGrid.appendChild(card);
      });

      lucide.createIcons();
    }

    // Cart actions
    function addToCart(product) {
      const existing = keranjang.find(item => item.id_produk === product.id_produk);
      if (existing) {
        existing.qty += 1;
      } else {
        keranjang.push({
          id_produk: product.id_produk,
          nama_produk: product.nama_produk,
          harga: product.harga,
          qty: 1
        });
      }
      localStorage.setItem('standalone_kntn_cart', JSON.stringify(keranjang));
      renderCart();
    }

    function changeQuantity(id, delta) {
      const item = keranjang.find(item => item.id_produk === id);
      if (item) {
        item.qty += delta;
        if (item.qty <= 0) {
          keranjang = keranjang.filter(it => it.id_produk !== id);
        }
      }
      localStorage.setItem('standalone_kntn_cart', JSON.stringify(keranjang));
      renderCart();
    }

    function clearCart() {
      if (confirm('Apakah Anda yakin ingin mengosongkan seluruh keranjang?')) {
        keranjang = [];
        localStorage.removeItem('standalone_kntn_cart');
        cashInput.value = '';
        renderCart();
      }
    }

    function setNominalBayar(amount) {
      cashInput.value = amount;
      calculateChange();
    }

    function calculateChange() {
      const total = computeTotal();
      const inputVal = Number(cashInput.value) || 0;
      if (inputVal >= total) {
        changeDisplay.innerText = formatRupiahJs(inputVal - total);
        changeDisplay.className = "py-2.5 px-3 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 font-bold text-sm";
      } else {
        changeDisplay.innerText = 'Uang Kurang';
        changeDisplay.className = "py-2.5 px-3 rounded-xl bg-slate-100 border border-slate-200/50 text-slate-400 font-bold text-sm";
      }
    }

    function computeTotal() {
      return keranjang.reduce((sum, item) => sum + (item.harga * item.qty), 0);
    }

    // Render cart sidebar list
    function renderCart() {
      cartItemsContainer.innerHTML = '';
      const total = computeTotal();
      totalPriceDisplay.innerText = formatRupiahJs(total);

      if (keranjang.length === 0) {
        cartItemsContainer.innerHTML = \`<div class="flex flex-col items-center justify-center py-10 text-slate-400 bg-slate-50/50 rounded-2xl border border-slate-100 h-full">
          <i data-lucide="shopping-cart" class="w-8 h-8 text-slate-300 animate-pulse"></i>
          <p class="text-xs font-bold text-slate-400 mt-2">Keranjang Belanja Kosong</p>
          <p class="text-[10px] text-slate-400">Silakan klik item produk di sebelah kiri</p>
        </div>\`;
        lucide.createIcons();
        calculateChange();
        return;
      }

      keranjang.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = "flex justify-between items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100";
        itemEl.innerHTML = \`
          <div class="flex-grow min-w-0">
            <h5 class="text-xs font-bold text-slate-700 line-clamp-1">\${item.nama_produk}</h5>
            <span class="text-[10px] text-slate-400 font-bold">\${formatRupiahJs(item.harga)}</span>
          </div>
          <div class="flex items-center gap-1 flex-shrink-0">
            <!-- - button targets 44px for easy tablet click -->
            <button onclick="changeQuantity('\${item.id_produk}', -1)" class="w-[44px] h-[44px] flex items-center justify-center rounded-xl bg-white hover:bg-slate-100 text-slate-500 font-bold border border-slate-200 transition select-none">
              <i data-lucide="minus" class="w-4 h-4"></i>
            </button>
            <span class="w-6 text-center text-xs font-semibold text-slate-700">\${item.qty}</span>
            <!-- + button targets 44px for easy tablet click -->
            <button onclick="changeQuantity('\${item.id_produk}', 1)" class="w-[44px] h-[44px] flex items-center justify-center rounded-xl bg-white hover:bg-slate-100 text-slate-500 font-bold border border-slate-200 transition select-none">
              <i data-lucide="plus" class="w-4 h-4"></i>
            </button>
          </div>
        \`;
        cartItemsContainer.appendChild(itemEl);
      });

      lucide.createIcons();
      calculateChange();
    }

    // Submit transactions
    async function submitTransaction() {
      const total = computeTotal();
      const received = Number(cashInput.value) || 0;
      
      if (keranjang.length === 0) {
        showAlert('error', 'Keranjang belanja tidak boleh kosong!');
        return;
      }
      if (received < total) {
        showAlert('error', 'Uang yang diinput lebih sedikit dibanding total belanja!');
        return;
      }

      const checkoutBtn = document.getElementById('checkout-button');
      checkoutBtn.disabled = true;
      checkoutBtn.innerText = 'Menyimpan Transaksi...';

      // Build Unique transaction ID format KNTN-[Timestamp]-[4 Angka Acak]
      const ts = Date.now().toString().slice(-6);
      const randDigits = Math.floor(1000 + Math.random() * 9000);
      const dateVal = new Date();
      const formattedDate = dateVal.getFullYear() +
        String(dateVal.getMonth() + 1).padStart(2, '0') +
        String(dateVal.getDate()).padStart(2, '0');
      const txId = 'KNTN-' + formattedDate + '-' + ts + '-' + randDigits;

      const payload = {
        action: "simpanTransaksi",
        id_transaksi: txId,
        total_harga: total,
        nominal_bayar: received,
        kembalian: received - total,
        metode: "Tunai",
        keranjang: keranjang
      };

      const hasBackend = localBackendUrl && localBackendUrl !== 'MASUKKAN_URL_APPS_SCRIPT_ANDA_DISINI';

      if (hasBackend) {
        try {
          const response = await fetch(localBackendUrl, {
            method: 'POST',
            mode: 'cors',
            headers: {
              'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(payload)
          });
          
          const textResult = await response.text();
          const result = JSON.parse(textResult);

          if (result && result.status === 'SUCCESS') {
            triggerReceiptModalShow(payload, dateVal);
            keranjang = [];
            localStorage.removeItem('standalone_kntn_cart');
            cashInput.value = '';
            renderCart();
            showAlert('success', 'Transaksi berhasil disimpan ke Spreadsheet!');
          } else {
            throw new Error(result.message || 'Sistem Spreadsheet Apps Script menolak data.');
          }
        } catch (err) {
          console.error(err);
          showAlert('error', 'Spreadsheet gagal merespon: ' + err.message + '. Namun, struk tetap di-generate local.');
          // Auto fallback
          triggerReceiptModalShow(payload, dateVal);
          keranjang = [];
          localStorage.removeItem('standalone_kntn_cart');
          cashInput.value = '';
          renderCart();
        } finally {
          checkoutBtn.disabled = false;
          checkoutBtn.innerHTML = \`<i data-lucide="shopping-bag" class="w-5 h-5"></i><span>Selesaikan Transaksi</span>\`;
          lucide.createIcons();
        }
      } else {
        // Mock offline succesful
        setTimeout(() => {
          triggerReceiptModalShow(payload, dateVal);
          keranjang = [];
          localStorage.removeItem('standalone_kntn_cart');
          cashInput.value = '';
          renderCart();
          showAlert('success', 'Transaksi Sukses! (Mode Simulasi Demo)');
          checkoutBtn.disabled = false;
          checkoutBtn.innerHTML = \`<i data-lucide="shopping-bag" class="w-5 h-5"></i><span>Selesaikan Transaksi</span>\`;
          lucide.createIcons();
        }, 600);
      }
    }

    // Trigger receipt UI modal
    function triggerReceiptModalShow(payload, dateObj) {
      document.getElementById('receipt-id').innerText = payload.id_transaksi;
      document.getElementById('receipt-date').innerText = dateObj.toLocaleString('id-ID');
      document.getElementById('receipt-total').innerText = formatRupiahJs(payload.total_harga);
      document.getElementById('receipt-cash').innerText = formatRupiahJs(payload.nominal_bayar);
      document.getElementById('receipt-change').innerText = formatRupiahJs(payload.kembalian);

      const itemsList = document.getElementById('receipt-items-list');
      itemsList.innerHTML = '';
      payload.keranjang.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'flex justify-between text-[10px]';
        itemEl.innerHTML = \`
          <span>\${item.nama_produk} (x\${item.qty})</span>
          <span>\${formatRupiahJs(item.harga * item.qty)}</span>
        \`;
        itemsList.appendChild(itemEl);
      });

      toggleReceiptModal();
    }

    // DOM LOAD INIT
    window.addEventListener('DOMContentLoaded', () => {
      updateGreeting();
      fetchAndSyncProducts();
      renderCart();
    });
  </script>
</body>
</html>`;

    // Download single html file via blob API
    const blob = new Blob([rawHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'index.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setSuccessMessage('Sukses! File index.html tunggal untuk GitHub Pages telah diunduh.');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="bg-[#F8FAFC] text-slate-800 min-h-screen flex flex-col font-sans selection:bg-amber-100 select-none">
      
      {/* TOP HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 min-h-16 flex items-center shadow-xs py-2 md:py-0">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col sm:flex-row justify-between items-center gap-3 w-full">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 px-2.5 py-1.5 rounded-lg text-white font-black italic shadow-xs text-sm tracking-widest select-none">
              KNTN
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-800 font-display">Kantin Sekolah Digital</h1>
              <p className="hidden sm:block text-[10px] text-slate-400 font-medium">Sistem Kasir Pintar Serverless</p>
            </div>
          </div>

          {/* Navigation Bar in middle */}
          <nav className="flex items-center gap-1 bg-slate-150/70 p-1 rounded-xl text-[11px] sm:text-xs font-bold text-slate-600 select-none">
            <button 
              onClick={() => setActiveTab('home')}
              className={`px-3 py-1.5 rounded-lg transition duration-150 cursor-pointer ${activeTab === 'home' ? 'bg-white text-slate-800 shadow-xs' : 'hover:bg-slate-50'}`}
            >
              Beranda Portal
            </button>
            <button 
              onClick={() => { setActiveTab('pos'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
              className={`px-3 py-1.5 rounded-lg transition duration-150 cursor-pointer ${activeTab === 'pos' ? 'bg-white text-slate-800 shadow-xs' : 'hover:bg-slate-50'}`}
            >
              Kasir POS
            </button>
            <button 
              onClick={() => { setActiveTab('transactions'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
              className={`px-3 py-1.5 rounded-lg transition duration-150 cursor-pointer ${activeTab === 'transactions' ? 'bg-white text-slate-800 shadow-xs' : 'hover:bg-slate-50'}`}
            >
              Riwayat Transaksi
            </button>
            <button 
              onClick={() => { setActiveTab('panduan'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
              className={`px-3 py-1.5 rounded-lg transition duration-150 cursor-pointer ${activeTab === 'panduan' ? 'bg-white text-slate-800 shadow-xs' : 'hover:bg-slate-50'}`}
            >
              Panduan Apps Script
            </button>
          </nav>

          <div className="flex items-center gap-3 md:gap-4 justify-end">
            <div className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border shadow-xs transition-colors duration-200 ${
              backendUrl 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${backendUrl ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
              <span>{backendUrl ? 'Sinkron Google Sheet' : 'Mode Demo Offline'}</span>
            </div>

            {/* Cashier profiles aligned with theme */}
            <div className="hidden md:flex items-center gap-3 text-sm text-slate-500 select-none">
              <div className="flex flex-col items-end leading-tight">
                <span className="font-bold text-slate-800 text-xs">Kasir: Siti Aminah</span>
                <span className="text-[10px] text-slate-400">Sesi: Pagi (07:00 - 12:00)</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-extrabold border border-amber-250 text-xs shadow-xs">SA</div>
            </div>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="bg-white hover:bg-slate-50 text-slate-600 px-3 py-2 rounded-xl transition duration-200 border border-slate-200 select-none flex items-center gap-1.5 text-xs font-bold shadow-xs active:scale-95 cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Pengaturan</span>
            </button>
          </div>
        </div>
      </header>

      {/* ALERT MESSAGES TOASTS */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-rose-50 border border-rose-300 text-rose-800 px-4 py-3 text-sm flex items-center gap-2.5 max-w-2xl mx-auto w-11/12 mt-4 rounded-xl shadow-xs"
          >
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
            <button className="ml-auto text-rose-500 hover:text-rose-700" onClick={() => setErrorMessage(null)}>
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 text-sm flex items-center gap-2.5 max-w-2xl mx-auto w-11/12 mt-4 rounded-xl shadow-xs"
          >
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
            <button className="ml-auto text-emerald-500 hover:text-emerald-700" onClick={() => setSuccessMessage(null)}>
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SETTINGS DRAWER / PANEL */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border-b border-slate-200 shadow-inner overflow-hidden select-text"
          >
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Google Apps Script settings Form */}
              <div className="lg:col-span-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-amber-500" />
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 font-display">Integrasi Database Spreadsheet</h4>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Web App URL Google Apps Script</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={backendUrl}
                      onChange={(e) => setBackendUrl(e.target.value)}
                      placeholder="Masukkan URL Apps Script: https://script.google.com/macros/s/.../exec"
                      className="flex-grow select-all border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder-slate-400 bg-slate-50 focus:bg-white transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveBackendUrl(backendUrl)}
                      className="bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white px-5 rounded-xl text-sm font-bold transition flex items-center gap-1"
                    >
                      {isFetchLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Koneksikan'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">Tinggalkan kosong bila tidak ada untuk mengoperasikan mode simulasi loka (demo offline).</p>
                </div>

                <div className="bg-amber-50 border border-amber-200/50 rounded-2xl p-4 flex gap-3 text-amber-800 text-xs">
                  <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold block">Kenapa sinkronisasi ini penting?</span>
                    <p>Integrasi serverless ini mem-fetch produk dari sheet <b>"Produk"</b> dan mem-posting transaksi setelah checkout langsung ke sheet <b>"Transaksi"</b> pada Google Sheets pribadi Anda.</p>
                  </div>
                </div>
              </div>

              {/* Standalone Single HTML compilation box */}
              <div className="lg:col-span-6 space-y-4 border-t lg:border-t-0 lg:border-l border-slate-100 lg:pl-6 pt-6 lg:pt-0">
                <div className="flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-indigo-500" />
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 font-display">Eksportir index.html Mandiri (GitHub Pages)</h4>
                </div>

                <div className="space-y-3 text-slate-600 text-sm">
                  <p>Butuh aplikasi ini dalam format satu file HTML tunggal tanpa server/React build untuk diunggah langsung ke GitHub Pages atau dibuka lokal?</p>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleDownloadStandaloneHtml}
                      className="flex-grow bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/10 active:scale-[0.98] text-white font-bold py-3.5 px-5 rounded-xl transition shadow-lg flex justify-center items-center gap-2"
                    >
                      <Download className="w-4.5 h-4.5" />
                      <span>Unduh index.html (Single File)</span>
                    </button>
                    
                    <button
                      onClick={() => setActiveTab(activeTab === 'panduan' ? 'pos' : 'panduan')}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3.5 px-4 rounded-xl transition flex justify-center items-center gap-2"
                    >
                      <Info className="w-4.5 h-4.5 text-slate-500" />
                      <span>{activeTab === 'panduan' ? 'Sembunyikan Panduan APPS Script' : 'Lihat Panduan APPS Script'}</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* APPS SCRIPT TUTORIALS PANEL */}
      {activeTab === 'panduan' && (
        <div className="bg-slate-900 text-slate-100 border-b border-slate-700 py-6 px-4 md:px-6 select-text">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-bold text-xs font-mono">STEP-BY-STEP</span>
                <h3 className="text-lg font-bold text-white font-display">Panduan Setup Google Spreadsheet Backend</h3>
              </div>
              <div className="flex gap-2 shrink-0">
                <button 
                  onClick={() => { setActiveTab('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 px-3 py-2 rounded-lg cursor-pointer transition"
                >
                  Beranda Portal
                </button>
                <button 
                  onClick={() => { setActiveTab('pos'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                  className="text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 px-3 py-2 rounded-lg cursor-pointer transition"
                >
                  Mulai Kasir POS
                </button>
              </div>
            </div>

            <ol className="list-decimal list-inside space-y-2 text-sm text-slate-300">
              <li>Buat Google Spreadsheet baru di Google Drive Anda.</li>
              <li>Buka menu <b>Ekstensi (Extensions) {`>`} Apps Script</b>.</li>
              <li>Hapus semua kode bawaan dan tempel kode JavaScript di bawah ini.</li>
              <li>Klik tombol <b>Terapkan (Deploy) {`>`} Terapkan Baru (New Deployment)</b>.</li>
              <li>Pilih tipe: <b>Aplikasi Web (Web App)</b>.</li>
              <li>Isi Akses ke: <b>Siapa Saja (Anyone)</b> (Penting agar web aplikasi client-side bisa menyimpan data tanpa login).</li>
              <li>Klik Terapkan, beri izin akses Google, lalu Salin <b>Tautan URL Aplikasi Web</b>.</li>
              <li>Masukkan tautan tersebut di kotak "Web App URL" di panel pengaturan di atas, lalu klik <b>Koneksikan</b>!</li>
            </ol>

            <div className="relative mt-4">
              <div className="absolute right-3 top-3 z-10 flex gap-2">
                <button
                  onClick={handleCopyScript}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 shadow-sm transition active:scale-[0.98]"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileCode className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? 'Tersalin' : 'Salin Kode'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 overflow-x-auto text-[11px] font-mono leading-relaxed text-indigo-200">
                <code>{appsScriptCode}</code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* PORTAL BERANDA PORTAL HOME SCREEN */}
      {activeTab === 'home' && (
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 flex-grow w-full flex flex-col gap-8">
          
          {/* BANNER GREETING HERO SECTION */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 md:p-8 border border-amber-200/40 relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-amber-200/20 to-transparent blur-2xl pointer-events-none"></div>
            
            <div className="space-y-3 max-w-2xl text-center md:text-left select-text">
              <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-850 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Portal Resmi Kantin Sekolah</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight font-display">
                Sistem Kasir Pintar, Bergizi & Serverless
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed font-sans">
                Selamat bekerja di panel manajemen utama. Kelola produk sehat kantin, catat transaksi kasir otomatis, dan singkronisasikan dengan database Google Sheets Anda secara langsung, aman tanpa biaya server.
              </p>
              
              <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-3">
                <button
                  onClick={() => { setActiveTab('pos'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                  className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-black px-6 py-3 rounded-xl transition shadow-lg shadow-amber-500/10 text-sm flex items-center gap-2 cursor-pointer"
                >
                  <ShoppingCart className="w-4.5 h-4.5" />
                  <span>BUKA KASIR POS</span>
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  className="bg-white hover:bg-slate-50 text-slate-705 font-bold border border-slate-200 px-5 py-3 rounded-xl transition text-sm flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Database className="w-4.5 h-4.5 text-amber-500" />
                  <span>Atur Database Link</span>
                </button>
              </div>
            </div>

            <div className="w-full md:w-auto flex-shrink-0 flex justify-center">
              <div className="bg-white p-5 rounded-2xl shadow-md border border-slate-100 max-w-xs relative text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-650 font-bold mb-3 text-lg border border-amber-200/50">
                  SA
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Siti Aminah</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Penanggung Jawab Kantin Sehat</p>
                <div className="w-full border-t border-slate-100 my-3"></div>
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-left w-full text-[10px] text-slate-500">
                  <span>Waktu Shift:</span>
                  <span className="font-bold text-slate-700 text-right">Pagi (07:00-12:00)</span>
                  <span>Kantin Sehat:</span>
                  <span className="font-bold text-emerald-600 text-right">Terverifikasi</span>
                </div>
              </div>
            </div>
          </div>

          {/* QUICK BENTO GRID DASHBOARD METRICS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* STATS 1: PRODUCTS INVENTORY */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50/50 border border-amber-100 flex items-center justify-center text-amber-600">
                <Utensils className="w-6 h-6" />
              </div>
              <div>
                <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Menu Aktif</span>
                <span className="text-2xl font-black text-slate-800 font-display">{products.length} Items</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Makanan, Minuman, Jajanan</span>
              </div>
            </div>

            {/* STATS 2: SHIFT SESSION */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-50/50 border border-orange-100 flex items-center justify-center text-orange-605">
                <Coffee className="w-6 h-6" />
              </div>
              <div>
                <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider">Metode Pembayaran</span>
                <span className="text-lg font-black text-slate-800 font-display">Tunai / Cash</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Mendukung Nominal Sekolah</span>
              </div>
            </div>

            {/* STATS 3: CONNECTION STATUS */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                backendUrl ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
              }`}>
                <Database className="w-6 h-6" />
              </div>
              <div className="flex-grow">
                <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider">Database Cloud</span>
                <span className={`text-sm font-black font-display block leading-tight ${
                  backendUrl ? 'text-emerald-700' : 'text-slate-700'
                }`}>
                  {backendUrl ? 'Terhubung Spreadsheet' : 'Simulasi Offline'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {backendUrl ? 'Sinkron Google Sheet' : 'Sesi Demo Mandiri'}
                </span>
              </div>
            </div>

            {/* STATS 4: LIVE CALENDAR */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-150 flex items-center justify-center text-slate-650">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider">Metode Sinkron</span>
                <span className="text-sm font-black text-slate-800 block">Sistem Serverless</span>
                <span className="text-[10px] text-slate-400 block mt-0.5 font-sans">Respons Super Instan</span>
              </div>
            </div>

          </div>

          {/* INTERACTIVE BENTO GRID SHORTCUTS & CAMPAIGN */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ACTIONS SHORTCUT PANEL (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex justify-between items-center sm:border-b sm:border-slate-100 pb-2">
                <h3 className="text-lg font-bold text-slate-800 font-display flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-500" />
                  <span>Jelajahi Portal Layanan</span>
                </h3>
                <span className="hidden sm:inline-block text-xs font-bold text-slate-450 uppercase tracking-widest bg-slate-100 py-1 px-2.5 rounded-md">PINTAS CEPAT</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* BUTTON-CARD 1: ENTER CASHIER BAR */}
                <div onClick={() => { setActiveTab('pos'); window.scrollTo({ top: 0, behavior: 'instant' }); }} className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-amber-400 cursor-pointer transition duration-200 flex flex-col justify-between group h-full shadow-xs hover:shadow-md">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-amber-150 group-hover:bg-amber-500 text-amber-600 group-hover:text-white flex items-center justify-center transition-colors">
                      <ShoppingCart className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-base text-slate-850 group-hover:text-amber-600 transition-colors">Mulai Kasir POS</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Kelola transaksi pembelian murid, hitung nominal kembalian otomatis dengan tombol pintas pecahan koin sekolah, dan cetak struk penjualan.
                    </p>
                  </div>
                  <div className="pt-4 flex items-center gap-1.5 text-xs font-bold text-amber-600 select-none">
                    <span>Meluncur ke POS</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* BUTTON-CARD 2: DATABASE CONFIG DRAWER */}
                <div onClick={() => { setShowSettings(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-amber-400 cursor-pointer transition duration-200 flex flex-col justify-between group h-full shadow-xs hover:shadow-md">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-150 group-hover:bg-emerald-500 text-emerald-600 group-hover:text-white flex items-center justify-center transition-colors">
                      <Database className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-base text-slate-850 group-hover:text-emerald-600 transition-colors">Atur Spreadsheet Link</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Masukkan URL Google Apps Script Aplikasi Web Anda untuk sinkronisasi inventori menu terpusat dan penyimpanan otomatis riwayat transaksi.
                    </p>
                  </div>
                  <div className="pt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-600 select-none">
                    <span>Buka Panel Database</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* BUTTON-CARD 3: DOCUMENTATION TUTORIAL */}
                <div onClick={() => { setActiveTab('panduan'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-amber-400 cursor-pointer transition duration-200 flex flex-col justify-between group h-full shadow-xs hover:shadow-md">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-indigo-150 group-hover:bg-indigo-500 text-indigo-600 group-hover:text-white flex items-center justify-center transition-colors">
                      <FileCode className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-base text-slate-850 group-hover:text-indigo-600 transition-colors">Panduan Setup Serverless</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Petunjuk langkah demi langkah lengkap beserta skrip siap-pakai Google Apps Script untuk membuat serverless database database Anda sendiri di Spreadsheet.
                    </p>
                  </div>
                  <div className="pt-4 flex items-center gap-1.5 text-xs font-bold text-indigo-600 select-none">
                    <span>Lihat Panduan Integrasi</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* BUTTON-CARD 4: LIVE EXPORT HTML STANDALONE */}
                <div onClick={handleDownloadStandaloneHtml} className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-amber-400 cursor-pointer transition duration-200 flex flex-col justify-between group h-full shadow-xs hover:shadow-md">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-violet-150 group-hover:bg-violet-500 text-violet-600 group-hover:text-white flex items-center justify-center transition-colors">
                      <Download className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-base text-slate-850 group-hover:text-violet-600 transition-colors">Simpan HTML Mandiri</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Download file index.html mandiri untuk dijalankan secara portabel, ditaruh di flashdisk kasir, atau hosting instan gratis di GitHub Pages.
                    </p>
                  </div>
                  <div className="pt-4 flex items-center gap-1.5 text-xs font-bold text-violet-600 select-none">
                    <span>Download index.html</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* BUTTON-CARD 5: BUKA RIWAYAT TRANSAKSI */}
                <div onClick={() => { setActiveTab('transactions'); window.scrollTo({ top: 0, behavior: 'instant' }); }} className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-amber-400 cursor-pointer transition duration-200 flex flex-col justify-between group h-full shadow-xs hover:shadow-md">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 group-hover:bg-amber-500 text-amber-600 group-hover:text-white flex items-center justify-center transition-colors">
                      <History className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-base text-slate-850 group-hover:text-amber-500 transition-colors">Laporan & Riwayat Penjualan</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Pantau omzet penjualan kantin sehat harian, saring data transaksi berdasarkan ID Nota, lalu ekspor pembukuan sebagai instan file Excel CSV.
                    </p>
                  </div>
                  <div className="pt-4 flex items-center gap-1.5 text-xs font-bold text-amber-600 select-none">
                    <span>Lihat Riwayat Laporan</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

              </div>
            </div>

            {/* EDUCATIONAL HEALTH SIDEBAR (4 cols) */}
            <div className="lg:col-span-4 space-y-5 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs select-text">
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] text-slate-400 font-extrabold tracking-widest uppercase">Edukasi Mutu</span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm font-display">Prinsip Kantin Sekolah Sehat</h4>
              </div>

              <div className="space-y-4">
                
                <div className="flex gap-3 text-xs">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 font-bold border border-emerald-100">1</div>
                  <div className="space-y-1">
                    <span className="font-bold text-slate-800 text-xs">Makanan Sehat & Higienis</span>
                    <p className="text-slate-500 leading-relaxed">Prinsip dasar menyajikan masakan berprotein tinggi, non-MSG berlebih, rendah bahan pengawet sintetik untuk kesehatan kognitif anak.</p>
                  </div>
                </div>

                <div className="flex gap-3 text-xs">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold border border-blue-100">2</div>
                  <div className="space-y-1">
                    <span className="font-bold text-slate-800 text-xs">Kurangi Sampah Plastik</span>
                    <p className="text-slate-500 leading-relaxed">Mengedukasi murid membawa ompreng makan dan botol mandiri serta meniadakan wadah kantong plastik jinjing tipis sekali pakai.</p>
                  </div>
                </div>

                <div className="flex gap-3 text-xs">
                  <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0 font-bold border border-orange-100">3</div>
                  <div className="space-y-1">
                    <span className="font-bold text-slate-800 text-xs">Sanitasi & Pengelolaan Air</span>
                    <p className="text-slate-500 leading-relaxed">Selalu mencuci tangan menggunakan sabun di air bersih mengalir sebelum menyajikan piring sajian jajanan sekolah sehat.</p>
                  </div>
                </div>

              </div>

              <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-100 text-[11px] text-amber-900 leading-relaxed">
                <span className="font-bold block mb-0.5">💡 Tips Operasional Kasir</span>
                Gunakan bento grid pencarian cepat di kolom POS untuk transaksi super efisien saat jam istirahat sekolah yang berlangsung hanya selama 20 menit berkala.
              </div>
            </div>

          </div>

          {/* DYNAMIC MENU BROWSER PREVIEW AT BERANDA */}
          <div className="space-y-5">
            <div className="flex justify-between items-center border-b border-slate-150 pb-2">
              <h3 className="text-base font-bold text-slate-850 font-display flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Pratinjau Daftar Menu Terdaftar ({products.length})</span>
              </h3>
              <button 
                onClick={() => { setActiveTab('pos'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                className="text-amber-600 hover:text-amber-700 font-semibold text-xs flex items-center gap-1"
              >
                <span>Kelola di POS</span>
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {products.slice(0, 12).map((p) => {
                const imageSrc = p.foto_drive_id 
                  ? `https://lh3.googleusercontent.com/d/${p.foto_drive_id}`
                  : getProductPlaceholderImage(p.id_produk, p.kategori);

                return (
                  <div key={p.id_produk} className="bg-white p-2.5 rounded-xl border border-slate-150 select-none flex flex-col justify-between gap-1.5 shadow-2xs hover:border-amber-250 transition-colors">
                    <div className="h-24 bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center relative">
                      <img src={imageSrc} alt={p.nama_produk} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <span className="absolute top-1.5 left-1.5 bg-white/90 text-slate-700 text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                        {p.kategori}
                      </span>
                    </div>
                    <div className="font-bold text-xs text-slate-800 line-clamp-1 leading-tight h-5 flex items-center">{p.nama_produk}</div>
                    <div className="flex justify-between items-center text-[10px] border-t border-slate-50 pt-1">
                      <span className="text-slate-400 font-mono font-medium">{p.id_produk}</span>
                      <span className="text-amber-600 font-extrabold">{formatRupiah(p.harga)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </main>
      )}

      {/* TRANSACTION HISTORY LOG VIEW */}
      {activeTab === 'transactions' && (
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 flex-grow w-full flex flex-col gap-6" id="tx-history-panel">
          
          {/* HEADER ROW WITH LIVE EXPORT BUTTONS */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-850 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest mb-1.5">
                <History className="w-3.5 h-3.5 text-amber-600" />
                <span>Modul Laporan Keuangan</span>
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight font-display">
                Catatan Transaksi Penjualan
              </h2>
              <p className="text-slate-500 text-xs">
                Pantau seluruh pembukuan transaksi lapor kantin sehat harian dan unduh sebagai file Spreadsheet.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
              <button
                id="btn-export-csv"
                onClick={handleExportCSV}
                className="bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-500/10 active:scale-95 text-white font-bold px-4 py-2.5 rounded-xl transition text-xs flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>EKSPOR SPREADSHEET (CSV)</span>
              </button>
              
              <button
                id="btn-delete-all-tx"
                onClick={handleResetTxHistory}
                disabled={transactions.length === 0}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                  transactions.length === 0 
                  ? 'bg-slate-50 border-slate-200 text-slate-300 pointer-events-none' 
                  : 'bg-white hover:bg-rose-50 border-rose-200 text-rose-600'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Semua Logs</span>
              </button>
            </div>
          </div>

          {/* METRICS BENTO GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="tx-metrics-grid">
            {/* STAT 1: TOTAL OMZET */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs hover:shadow-xs transition duration-200 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
                <DollarSign className="w-5 h-5 font-bold" />
              </div>
              <div>
                <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Pendapatan</span>
                <span className="text-xl font-black text-slate-800 font-display">{formatRupiah(totalRevenue)}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Semesta item tersaring</span>
              </div>
            </div>

            {/* STAT 2: TOTAL TRANSAKSI */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs hover:shadow-xs transition duration-200 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
                <History className="w-5 h-5 font-bold" />
              </div>
              <div>
                <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider">Jumlah Transaksi</span>
                <span className="text-xl font-black text-slate-800 font-display">{totalTxCount} Nota</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Tercatat secara instan</span>
              </div>
            </div>

            {/* STAT 3: RATA-RATA TRANSAKSI */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs hover:shadow-xs transition duration-200 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
                <TrendingUp className="w-5 h-5 font-bold" />
              </div>
              <div>
                <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider">Rata-rata Belanja</span>
                <span className="text-xl font-black text-slate-800 font-display">{formatRupiah(averageBasket)}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Nilai keranjang (AOV)</span>
              </div>
            </div>

            {/* STAT 4: TOTAL KUANTITAS */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs hover:shadow-xs transition duration-200 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100 shrink-0">
                <Utensils className="w-5 h-5 font-bold" />
              </div>
              <div>
                <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider">Porsi Menu Terjual</span>
                <span className="text-xl font-black text-slate-800 font-display">{totalQtySold} Porsi</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Asupan gizi anak sekolah</span>
              </div>
            </div>
          </div>

          {/* FILTER AND SEARCH CONTROLS */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 shadow-3xs" id="tx-search-filters">
            {/* Search items inside tx */}
            <div className="relative w-full md:w-96 select-text">
              <input 
                id="tx-search-input"
                type="text" 
                value={txSearchQuery}
                onChange={(e) => setTxSearchQuery(e.target.value)}
                placeholder="Cari ID Nota atau nama produk tertentu..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-250 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-xs placeholder-slate-400 transition-all font-sans"
              />
              <div className="absolute left-3.5 top-2.5 text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              {txSearchQuery && (
                <button 
                  onClick={() => setTxSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-semibold"
                >
                  X
                </button>
              )}
            </div>

            {/* Date switches */}
            <div className="flex gap-2 w-full md:w-auto self-start md:self-center select-none" id="tx-date-filters">
              <button
                onClick={() => setTxFilterDate('Semua')}
                className={`flex-grow md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold border transition ${
                  txFilterDate === 'Semua'
                    ? 'bg-slate-800 border-slate-800 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Semua Riwayat
              </button>
              <button
                onClick={() => setTxFilterDate('Hari Ini')}
                className={`flex-grow md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold border transition ${
                  txFilterDate === 'Hari Ini'
                    ? 'bg-slate-800 border-slate-800 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Hari Ini
              </button>
            </div>
          </div>

          {/* TRANSACTION TABLE LIST ROW */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-3xs" id="tx-table-container">
            {filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 select-none text-center px-4">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 border mb-3">
                  <History className="w-8 h-8" />
                </div>
                <h4 className="text-slate-700 font-bold text-sm">Tidak Ada Transaksi Ditemukan</h4>
                <p className="text-slate-400 text-xs max-w-sm mt-1">
                  Bila filter aktif, sesuaikan kata pencarian Anda atau lakukan checkout transaksi POS baru terlebih dahulu.
                </p>
                <div className="mt-4 flex gap-2">
                  <button 
                    onClick={() => { setTxSearchQuery(''); setTxFilterDate('Semua'); }}
                    className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-750 px-3.5 py-1.5 rounded-lg transition"
                  >
                    Buka Semua Filter
                  </button>
                  <button 
                    onClick={() => { setActiveTab('pos'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                    className="text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-1.5 rounded-lg transition"
                  >
                    Mulai POS Kasir
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-sans text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-5">ID Nota</th>
                      <th className="py-3.5 px-4">Tanggal & Waktu</th>
                      <th className="py-3.5 px-4">Daftar Jajanan / Makanan</th>
                      <th className="py-3.5 px-4 text-right">Total Belanja</th>
                      <th className="py-3.5 px-4 text-center">Metode</th>
                      <th className="py-3.5 px-5 text-right">Aksi Layanan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.map((tx) => (
                      <tr key={tx.id_transaksi} className="hover:bg-slate-50/70 transition-colors">
                        
                        {/* ID NOTA */}
                        <td className="py-3.5 px-5 whitespace-nowrap font-medium text-slate-800 select-all">
                          <div className="flex items-center gap-1.5 group">
                            <span className="font-mono font-bold text-slate-700">{tx.id_transaksi}</span>
                            <button 
                              onClick={() => handleCopyTxId(tx.id_transaksi)}
                              className="text-slate-300 hover:text-amber-600 p-0.5 rounded transition cursor-pointer"
                              title="Salin ID Nota"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        {/* TANGGAL */}
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-300" />
                            <span>{tx.tanggal}</span>
                          </div>
                        </td>

                        {/* LIST ITEMS */}
                        <td className="py-3.5 px-4 min-w-[200px] max-w-sm">
                          <div className="flex flex-col gap-0.5">
                            {tx.keranjang.map((item, idx) => (
                              <div key={idx} className="text-slate-700 font-medium truncate leading-tight flex justify-between gap-2">
                                <span className="truncate">{item.nama_produk}</span>
                                <span className="font-mono text-slate-400 flex-shrink-0">x{item.qty}</span>
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* TOTAL HARGA */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <span className="font-black text-slate-800 font-display">{formatRupiah(tx.total_harga)}</span>
                        </td>

                        {/* METODE */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                            {tx.metode}
                          </span>
                        </td>

                        {/* ACTIONS */}
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <div className="flex justify-end items-center gap-1.5">
                            <button
                              onClick={() => { setLatestTransaction(tx); setShowReceipt(true); }}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-amber-400 text-slate-650 hover:text-amber-500 transition duration-150 flex items-center gap-1 justify-center active:scale-95 cursor-pointer font-bold text-[10px]"
                              title="Cetak Receipt/Struk"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Struk</span>
                            </button>
                            <button
                              onClick={() => handleDeleteTx(tx.id_transaksi)}
                              className="p-1.5 rounded-lg border border-slate-100 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-400 hover:text-rose-600 transition duration-150 cursor-pointer active:scale-95"
                              title="Hapus Entri Log"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 text-[11px] text-slate-500 leading-relaxed flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 select-text" id="tx-security-tip">
            <span>🛡️ <b>Mekanisme Keamanan Riwayat</b>: Riwayat transaksi disimpan aman di penyimpanan sandboxed browser Anda secara non-volatile. Jika database terhubung, transaksi terkirim otomatis pada detil sheet "Transaksi".</span>
            <span className="shrink-0 text-[10px] font-semibold text-amber-600">Terbuka di 1 Sesi Operator: Siti Aminah</span>
          </div>

        </main>
      )}

      {/* CORE POS BODY */}
      {activeTab === 'pos' && (
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 flex-grow w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: PRODUCTS SECTION (60% width) */}
        <section className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
          
          {/* GREETING & SEARCH FILTER BAR */}
          <div className="bg-white p-4 md:p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="w-full sm:w-auto">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Petugas Kasir Kantin</p>
              <h2 className="text-xl font-bold text-slate-800 font-display">{greetingText}! 😊</h2>
            </div>

            {/* SEACH BAR */}
            <div className="relative w-full sm:w-72">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari menu makanan, jus, roti..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-250 focus:outline-none focus:ring-2 focus:ring-amber-550 focus:border-amber-550 text-sm placeholder-slate-400 bg-slate-50 focus:bg-white transition-all"
              />
              <div className="absolute left-3.5 top-3 text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* DYNAMIC HIGH-CONTRAST CATEGORY ACCENT TABS */}
          <div className="bg-white p-2 rounded-full shadow-sm border border-slate-100 flex gap-2 overflow-x-auto">
            <button
              onClick={() => setCategory('Semua')}
              className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                category === 'Semua'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10'
                  : 'bg-white text-slate-600 font-medium border border-slate-200 hover:border-amber-300'
              }`}
            >
              <span>Semua</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                category === 'Semua' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>{categoryCounts.Semua}</span>
            </button>

            <button
              onClick={() => setCategory('Makanan')}
              className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                category === 'Makanan'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10'
                  : 'bg-white text-slate-600 font-medium border border-slate-200 hover:border-amber-300'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Makanan</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                category === 'Makanan' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>{categoryCounts.Makanan}</span>
            </button>

            <button
              onClick={() => setCategory('Minuman')}
              className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                category === 'Minuman'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10'
                  : 'bg-white text-slate-600 font-medium border border-slate-200 hover:border-amber-300'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Minuman</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                category === 'Minuman' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>{categoryCounts.Minuman}</span>
            </button>

            <button
              onClick={() => setCategory('Jajanan')}
              className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                category === 'Jajanan'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10'
                  : 'bg-white text-slate-600 font-medium border border-slate-200 hover:border-amber-300'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Jajanan</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                category === 'Jajanan' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>{categoryCounts.Jajanan}</span>
            </button>
          </div>

          {/* DYNAMIC PRODUCT LISTS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-400 bg-white border border-slate-100 rounded-2xl shadow-xs">
                <Info className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-slate-500 text-sm">Menu tidak ditemukan</p>
                <p className="text-xs text-slate-400">Silakan ubah kata kunci pencarian atau ganti kategori.</p>
              </div>
            ) : (
              filteredProducts.map((p) => {
                const imageSrc = p.foto_drive_id 
                  ? `https://lh3.googleusercontent.com/d/${p.foto_drive_id}`
                  : getProductPlaceholderImage(p.id_produk, p.kategori);

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.15 }}
                    key={p.id_produk}
                    onClick={() => handleAddToCart(p)}
                    className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-2 hover:shadow-md transition-all duration-200 cursor-pointer group active:scale-[0.98] select-none"
                  >
                    {/* Render Image with Referrer no referrer format for Google Drive protection bypass */}
                    <div className="h-32 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center relative">
                      <img 
                        src={imageSrc} 
                        alt={p.nama_produk} 
                        className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                      <span className="absolute top-2.5 left-2.5 bg-white/95 text-slate-700 text-[10px] font-bold py-0.5 px-2 rounded-full uppercase tracking-wider shadow-xs backdrop-blur font-sans">
                        {p.kategori}
                      </span>
                    </div>

                    <div className="font-bold text-sm leading-tight text-slate-800 line-clamp-2 mt-1 min-h-[36px] flex items-center">
                      {p.nama_produk}
                    </div>
                    <div className="flex justify-between items-center pt-1.5 border-t border-slate-50">
                      <span className="text-[10px] text-slate-400 font-mono font-medium">{p.id_produk}</span>
                      <div className="text-amber-600 font-black text-sm md:text-base">
                        {formatRupiah(p.harga)}
                      </div>
                    </div>
                    <button className="mt-1 w-full bg-slate-50 group-hover:bg-amber-50 text-slate-400 group-hover:text-amber-600 text-xs font-bold py-2 rounded-lg transition-colors">
                      TAMBAH
                    </button>
                  </motion.div>
                );
              })
            )}
          </div>

        </section>

        {/* RIGHT COLUMN: STICKY BASKET CART & PAYMENT DETAILS (40% width) */}
        <section className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24 max-h-[calc(100vh-120px)] flex flex-col shadow-[-10px_0_15px_rgba(0,0,0,0.02)] z-10 bg-white rounded-2xl border border-slate-200">
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Cart Banner Header resembling provided theme */}
            <div className="px-6 py-4 bg-white border-b border-slate-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-500" />
                <h2 className="text-base font-bold text-slate-800 font-display">Detail Pesanan</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-100 text-amber-750 text-xs font-bold px-2 py-1 rounded-md select-none lowercase first-letter:uppercase">
                  {cart.reduce((sum, item) => sum + item.qty, 0)} ITEM
                </span>
                
                {cart.length > 0 && (
                  <button 
                    onClick={handleClearCart}
                    className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-xl transition duration-150 select-none cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                )}
              </div>
            </div>

            {/* Cart Items List Container with smooth layout items of design */}
            <div className="px-6 py-4 overflow-y-auto space-y-4 max-h-[280px] min-h-[140px] flex-grow custom-scroll">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200/60 h-full">
                  <ShoppingCart className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-500">Keranjang Masih Kosong</p>
                  <p className="text-[10px] text-slate-400 text-center max-w-[200px] mt-0.5">Silakan ketuk produk di sebelah kiri untuk ditambahkan.</p>
                </div>
              ) : (
                <AnimatePresence>
                  {cart.map((item) => (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -25 }}
                      key={item.id_produk}
                      className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-800 line-clamp-1 leading-tight">{item.nama_produk}</div>
                        <div className="text-xs text-slate-400 mt-0.5">@ {formatRupiah(item.harga)}</div>
                      </div>

                      {/* Quantity Increments (+/-) touch target minimum 44px equivalent via padding/wrapper */}
                      <div className="flex items-center gap-2 flex-shrink-0 select-none">
                        <button 
                          onClick={() => handleUpdateQty(item.id_produk, -1)}
                          className="w-[32px] h-[32px] rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-lg text-slate-600 transition duration-150 active:scale-95 cursor-pointer"
                          aria-label="Kurangi Jumlah"
                        >
                          -
                        </button>
                        <span className="font-bold w-4 text-center text-sm text-slate-800">{item.qty}</span>
                        <button 
                          onClick={() => handleUpdateQty(item.id_produk, 1)}
                          className="w-[32px] h-[32px] rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-lg text-amber-600 transition duration-150 active:scale-95 cursor-pointer"
                          aria-label="Tambah Jumlah"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-sm font-black w-20 text-right text-slate-800 shrink-0">
                        {formatRupiah(item.harga * item.qty)}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Calculations and payment inputs in high-density structure */}
            <div className="px-6 pt-4 border-t-2 border-dashed border-slate-100 space-y-3 shrink-0">
              <div className="flex justify-between text-slate-500 text-sm">
                <span>Subtotal</span>
                <span className="font-medium">{formatRupiah(totalHarga)}</span>
              </div>
              <div className="flex justify-between text-lg font-black text-slate-900">
                <span>Total Bayar</span>
                <span className="text-amber-600 font-black">{formatRupiah(totalHarga)}</span>
              </div>
            </div>

            {/* Segmented Payment Method Selector */}
            <div className="px-6 mt-4 space-y-2 shrink-0">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Metode Pembayaran</label>
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setMetodePembayaran('Tunai');
                    setNominalBayar('');
                  }}
                  className={`py-2 px-1 rounded-xl text-xs font-semibold transition flex flex-col items-center gap-1.5 cursor-pointer ${
                    metodePembayaran === 'Tunai'
                      ? 'bg-amber-500 text-white shadow-sm font-bold'
                      : 'bg-transparent text-slate-650 hover:bg-slate-100'
                  }`}
                >
                  <Coins className="w-4 h-4" />
                  <span>Tunai</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMetodePembayaran('QRIS');
                    setNominalBayar(totalHarga);
                  }}
                  className={`py-2 px-1 rounded-xl text-xs font-semibold transition flex flex-col items-center gap-1.5 cursor-pointer ${
                    metodePembayaran === 'QRIS'
                      ? 'bg-amber-500 text-white shadow-sm font-bold'
                      : 'bg-transparent text-slate-650 hover:bg-slate-100'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>QRIS</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMetodePembayaran('Tabungan');
                    setNominalBayar(totalHarga);
                  }}
                  className={`py-2 px-1 rounded-xl text-xs font-semibold transition flex flex-col items-center gap-1.5 cursor-pointer ${
                    metodePembayaran === 'Tabungan'
                      ? 'bg-amber-500 text-white shadow-sm font-bold'
                      : 'bg-transparent text-slate-650 hover:bg-slate-100'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  <span>Tabungan</span>
                </button>
              </div>
            </div>

            {/* Quick School Payments & cash container with responsive inputs */}
            <div className="mt-4 px-6 space-y-4 shrink-0">
              {metodePembayaran === 'Tunai' ? (
                <>
                  <div className="grid grid-cols-4 gap-2">
                    {[5000, 10000, 20000, 50000].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => handleQuickAmount(amount)}
                        className={`py-2 rounded-lg text-xs font-bold border transition duration-150 active:scale-95 cursor-pointer ${
                          nominalBayar === amount 
                            ? 'bg-amber-100 text-amber-700 border-amber-300' 
                            : 'bg-slate-100 text-slate-650 hover:bg-amber-100 border-slate-200 font-bold'
                        }`}
                      >
                        {amount.toLocaleString('id-ID')}
                      </button>
                    ))}
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center mb-1.5 select-none">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Diterima (Rp)</label>
                      <span 
                        onClick={() => handleQuickAmount(totalHarga)}
                        className="text-[11px] text-amber-600 font-bold underline cursor-pointer hover:text-amber-700"
                      >
                        Uang Pas
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-2xl font-black text-slate-400 mr-2 select-none">Rp</span>
                      <input 
                        type="number" 
                        value={nominalBayar}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNominalBayar(val === '' ? '' : Number(val));
                        }}
                        placeholder="0"
                        className="w-full bg-transparent text-2xl font-black focus:outline-none placeholder-slate-300 text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-amber-50 border border-amber-100 rounded-xl select-none">
                    <span className="text-sm font-bold text-amber-800">Kembalian</span>
                    <span className="text-xl font-black text-amber-600">
                      {nominalBayar !== '' && nominalBayar >= totalHarga 
                        ? formatRupiah(kembalian) 
                        : 'Rp 0'}
                    </span>
                  </div>
                </>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200/65 p-4 rounded-xl space-y-2 select-text">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <CheckCircle className="w-4.5 h-4.5 text-emerald-600 flex-shrink-0" />
                    <span>Pembayaran Non-Tunai ({metodePembayaran})</span>
                  </div>
                  <p className="text-slate-550 text-[11px] leading-relaxed font-sans">
                    Pesanan akan segera diselesaikan menggunakan transaksi nirkabel/digital <b>{metodePembayaran}</b> tanpa koin uang kembalian fisik kasir.
                  </p>
                  <div className="bg-white px-3.5 py-2 rounded-lg border border-emerald-100 flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold text-[10px] uppercase">Jumlah Ditransfer</span>
                    <span className="font-black text-emerald-700 font-display">{formatRupiah(totalHarga)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Checkout decision block */}
            <div className="p-6 bg-slate-50 border-t border-slate-200 mt-6 shrink-0">
              <button
                disabled={isSubmitting || cart.length === 0}
                onClick={handleCheckout}
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl shadow-lg shadow-amber-200 text-lg transition-all active:scale-[0.98] disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>MENYIMPAN TRANSAKSI...</span>
                  </>
                ) : (
                  <>
                    <span>SELESAIKAN TRANSAKSI</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </section>
      </main>
      )}

      {/* RECEIPT PRINT DIALOG MODAL */}
      <AnimatePresence>
        {showReceipt && latestTransaction && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 relative"
            >
              <button 
                onClick={() => setShowReceipt(false)}
                className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 bg-slate-150/70 p-1.5 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Printable Struk Receipt Layout Area */}
              <div className="border border-amber-300/30 rounded-2xl p-5 bg-amber-50/15 font-mono text-xs select-text">
                <div className="text-center pb-4 border-b border-dashed border-slate-300 space-y-1">
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide font-display">Kantin Sekolah</h4>
                  <p className="text-[10px] text-slate-400 font-sans">SDN Harapan & Cita-Cita</p>
                  <p className="text-[9px] text-slate-400 font-sans">Jl. Ceria Anak Bangsa No. 12</p>
                </div>

                <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-slate-500 text-[10px]">
                  <div className="flex justify-between">
                    <span>TRANS ID:</span>
                    <span className="font-bold text-slate-700">{latestTransaction.id_transaksi}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TANGGAL:</span>
                    <span>{latestTransaction.tanggal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>KASIR:</span>
                    <span>Petugas Kantin</span>
                  </div>
                  <div className="flex justify-between">
                    <span>METODE:</span>
                    <span>{latestTransaction.metode}</span>
                  </div>
                </div>

                {/* list products code */}
                <div className="py-3 border-b border-dashed border-slate-300 space-y-1.5 text-slate-600">
                  {latestTransaction.keranjang.map((it) => (
                    <div key={it.id_produk} className="flex justify-between text-[10px]">
                      <span className="max-w-[180px] truncate">{it.nama_produk} (x{it.qty})</span>
                      <span>{formatRupiah(it.harga * it.qty)}</span>
                    </div>
                  ))}
                </div>

                <div className="py-3 space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-slate-850">
                    <span>TOTAL BELANJA:</span>
                    <span>{formatRupiah(latestTransaction.total_harga)}</span>
                  </div>
                  <div className="flex justify-between text-slate-550">
                    <span>BAYAR TUNAI:</span>
                    <span>{formatRupiah(latestTransaction.nominal_bayar)}</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-orange-600">
                    <span>KEMBALIAN:</span>
                    <span>{formatRupiah(latestTransaction.kembalian)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-dashed border-slate-300 text-center text-slate-450 font-sans text-[9px] space-y-0.5">
                  <p className="font-bold text-slate-600 font-display text-xs">Terima Kasih Banyak!</p>
                  <p>Jangan lupa buang sampah pada tempatnya ya!</p>
                  <p>Selamat menikmati makanan sehatmu.</p>
                </div>
              </div>

              {/* Receipt Control print */}
              <div className="flex gap-2.5 mt-5">
                <button
                  onClick={() => window.print()}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-bold py-3.5 px-4 rounded-xl text-xs transition flex justify-center items-center gap-1.5 shadow-sm shadow-amber-500/10"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Struk POS</span>
                </button>
                <button
                  onClick={() => setShowReceipt(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-3.5 px-4 rounded-xl text-xs transition text-center"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="mt-auto bg-white py-6 border-t border-slate-200/60 text-center text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p>© 2026 Kasir Kantin Sekolah POS. All Rights Reserved.</p>
          <p className="font-semibold text-slate-500 flex items-center gap-1">
            <span>Serverless Backend with Google Sheets Docs</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
