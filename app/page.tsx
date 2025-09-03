"use client";

import React, { useState, useMemo, useRef } from "react";

// --- Real Data from Excel (sampled and mapped) ---
const MOCK_LISTINGS = [
  {
    name: "163 Apts.",
    address: "16275 NE 19th Ct,Miami",
    zip: "33162",
    district: "District 2",
    agent: "Family",
    contact: "305-957-0007",
    photo: "https://via.placeholder.com/150x100?text=Photo",
    type: "Public",
    senior: false,
  },
  {
    name: "2135 Apts.",
    address: "2135 NE 169 St, North Miami Beach",
    zip: "33162",
    district: "District 4",
    agent: "Family",
    contact: "305-957-0007",
    photo: "https://via.placeholder.com/150x100?text=Photo",
    type: "Private",
    senior: false,
  },
  {
    name: "46 St. Duplexes",
    address: "Scattered sites within NW area, Miami",
    zip: "33142",
    district: "District 3",
    agent: "Family",
    contact: "305-758-7022",
    photo: "https://via.placeholder.com/150x100?text=Photo",
    type: "Public",
    senior: false,
  },
  {
    name: "Amber Garden",
    address: "1320 NW 24 St, Miami",
    zip: "33142",
    district: "District 3",
    agent: "Elderly",
    contact: "305-403-3720",
    photo: "https://via.placeholder.com/150x100?text=Photo",
    type: "Private",
    senior: true,
  },
  {
    name: "Barbella Gardens",
    address: "17050 NW 55 Ave, Miami",
    zip: "33055",
    district: "District 13",
    agent: "Family",
    contact: "954-559-9816",
    photo: "https://via.placeholder.com/150x100?text=Photo",
    type: "Private",
    senior: false,
  },
  {
    name: "Biscayne Court",
    address: "5211 NW 17 Ave, Miami",
    zip: "33142",
    district: "District 3",
    agent: "Elderly",
    contact: "305-696-6223",
    photo: "https://via.placeholder.com/150x100?text=Photo",
    type: "Private",
    senior: true,
  },
  {
    name: "Brisas Del Mar Apartments",
    address: "556 West Flagler,Miami",
    zip: "33130",
    district: "District 5",
    agent: "Elderly",
    contact: "305-377-2020",
    photo: "https://via.placeholder.com/150x100?text=Photo",
    type: "Public",
    senior: true,
  },
  {
    name: "Brownsville Transit Village II",
    address: "5225 NW 29 Ave, Miami",
    zip: "33142",
    district: "District 3",
    agent: "Elderly",
    contact: "305-633-2350",
    photo: "https://via.placeholder.com/150x100?text=Photo",
    type: "Private",
    senior: true,
  },
  {
    name: "Camillus House (Sommerville)",
    address: "1603-1627 NW 7 Ave, Miami",
    zip: "33136",
    district: "District 3",
    agent: "Homeless",
    contact: "305-374-1065 Ext. 314",
    photo: "https://via.placeholder.com/150x100?text=Photo",
    type: "Private",
    senior: false,
  },
  {
    name: "Casa Matias f/k/a MCR Apartments I",
    address: "14340 SW 260 St. Miami,",
    zip: "33032",
    district: "District 8",
    agent: "Family",
    contact: "305-258-5959",
    photo: "https://via.placeholder.com/150x100?text=Photo",
    type: "Public",
    senior: false,
  },
  // ... (add more entries as needed, following the same mapping) ...
];

const DISTRICTS = [
  "District 1",
  "District 2",
  "District 3",
  "District 4",
  "District 5",
  "District 6",
  "District 7",
  "District 8",
  "District 9",
  "District 10",
  "District 11",
  "District 12",
  "District 13",
];

const HOUSING_TYPES = ["Public", "Private"];

// Utility: CSV export
function exportToCSV(data: any[], filename: string) {
  const replacer = (key: string, value: any) => (value === null ? '' : value);
  const header = Object.keys(data[0]);
  const csv = [
    header.join(','),
    ...data.map(row =>
      header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(',')
    ),
  ].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Utility: Print table
function printTable(ref: React.RefObject<HTMLTableElement>) {
  if (!ref.current) return;
  const printContents = ref.current.outerHTML;
  const win = window.open('', '', 'height=700,width=900');
  if (win) {
    win.document.write('<html><head><title>Print Listings</title>');
    win.document.write('<style>body{font-family:Roboto,sans-serif;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ccc;padding:8px;}th{background:#003087;color:#fff;}@media print{body{background:#fff;}}</style>');
    win.document.write('</head><body>');
    win.document.write(printContents);
    win.document.write('</body></html>');
    win.document.close();
    win.print();
  }
}

// Main Component
const HomePage: React.FC = () => {
  // --- State ---
  const [search, setSearch] = useState('');
  const [searchFocus, setSearchFocus] = useState(false);
  const [zipFilter, setZipFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [seniorOnly, setSeniorOnly] = useState(false);
  const [view, setView] = useState<'tile' | 'table'>('tile');
  const [page, setPage] = useState(1);
  const [tablePage, setTablePage] = useState(1);
  const [sortCol, setSortCol] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // --- Autocomplete ---
  const devNames = useMemo(() =>
    Array.from(new Set(MOCK_LISTINGS.map(l => l.name))),
    []
  );
  const autoResults = useMemo(() =>
    search && searchFocus
      ? devNames.filter(n => n.toLowerCase().includes(search.toLowerCase())).slice(0, 5)
      : [],
    [search, searchFocus, devNames]
  );

  // --- Filtering ---
  const filteredListings = useMemo(() => {
    let list = MOCK_LISTINGS;
    if (search) {
      list = list.filter(l =>
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.zip.includes(search) ||
        l.district.toLowerCase().includes(search.toLowerCase()) ||
        l.type.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (zipFilter) {
      const zips = zipFilter.split(',').map(z => z.trim());
      list = list.filter(l => zips.includes(l.zip));
    }
    if (districtFilter) {
      list = list.filter(l => l.district === districtFilter);
    }
    if (typeFilter) {
      list = list.filter(l => l.type === typeFilter);
    }
    if (seniorOnly) {
      list = list.filter(l => l.senior);
    }
    return list;
  }, [search, zipFilter, districtFilter, typeFilter, seniorOnly]);

  // --- Pagination ---
  const tilePerPage = 12;
  const tablePerPage = 20;
  const tilePages = Math.ceil(filteredListings.length / tilePerPage);
  const tablePages = Math.ceil(filteredListings.length / tablePerPage);
  const pagedTileListings = filteredListings.slice((page - 1) * tilePerPage, page * tilePerPage);
  const pagedTableListings = useMemo(() => {
    let list = [...filteredListings];
    if (sortCol) {
      list.sort((a, b) => {
        const aVal = a[sortCol as keyof typeof a];
        const bVal = b[sortCol as keyof typeof b];
        if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return list.slice((tablePage - 1) * tablePerPage, tablePage * tablePerPage);
  }, [filteredListings, tablePage, sortCol, sortDir]);

  // --- Table Print Ref ---
  const tableRef = useRef<HTMLTableElement>(null);

  // --- Handlers ---
  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  // --- Responsive Filter Panel ---
  const [filterOpen, setFilterOpen] = useState(false);

  // --- Render ---
  return (
    <div className="min-h-screen flex flex-col bg-miami-gray">
      {/* Header */}
      <header className="bg-miami-blue text-white w-full">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <a href="/">
              <img src="/src/logo.png" alt="Ojas ka Logo" className="h-10 w-auto" aria-label="Miami-Dade Logo" />
            </a>
            <nav className="ml-6 hidden md:flex gap-6" aria-label="Main Navigation">
              <a href="#" className="hover:underline focus:outline-none focus:ring-2 focus:ring-white">Home</a>
              <a href="#about" className="hover:underline focus:outline-none focus:ring-2 focus:ring-white">About</a>
              <a href="#listings" className="hover:underline focus:outline-none focus:ring-2 focus:ring-white">Listings</a>
              <a href="#resources" className="hover:underline focus:outline-none focus:ring-2 focus:ring-white">Resources</a>
              <a href="#contact" className="hover:underline focus:outline-none focus:ring-2 focus:ring-white">Contact</a>
            </nav>
          </div>
          {/* Search Bar */}
          <div className="relative w-full md:w-96 mt-3 md:mt-0" role="search">
            <input
              type="text"
              className="w-full rounded-full px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-miami-teal"
              placeholder="Search by Zip Code, District, or Housing Type…"
              aria-label="Search by Zip Code, District, or Housing Type"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); setTablePage(1); }}
              onFocus={() => setSearchFocus(true)}
              onBlur={() => setTimeout(() => setSearchFocus(false), 200)}
            />
            {autoResults.length > 0 && (
              <ul className="absolute z-10 left-0 right-0 bg-white border border-gray-200 rounded-b shadow max-h-48 overflow-auto" role="listbox">
                {autoResults.map((name, i) => (
                  <li
                    key={name}
                    className="px-4 py-2 cursor-pointer hover:bg-miami-gray"
                    tabIndex={0}
                    role="option"
                    aria-selected={false}
                    onMouseDown={() => { setSearch(name); setSearchFocus(false); }}
                  >
                    {name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Mobile Nav */}
          <nav className="flex md:hidden mt-3 gap-4" aria-label="Mobile Navigation">
            <a href="#" className="hover:underline focus:outline-none focus:ring-2 focus:ring-white">Home</a>
            <a href="#about" className="hover:underline focus:outline-none focus:ring-2 focus:ring-white">About</a>
            <a href="#listings" className="hover:underline focus:outline-none focus:ring-2 focus:ring-white">Listings</a>
            <a href="#resources" className="hover:underline focus:outline-none focus:ring-2 focus:ring-white">Resources</a>
            <a href="#contact" className="hover:underline focus:outline-none focus:ring-2 focus:ring-white">Contact</a>
          </nav>
        </div>
      </header>

      {/* Filter Panel */}
      <div className="w-full bg-white shadow-sm border-b border-miami-gray">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row">
          {/* Sidebar (desktop) */}
          <aside className="hidden md:block w-64 p-4 border-r border-miami-gray bg-white" aria-label="Filters">
            <h2 className="font-bold text-lg mb-4 text-miami-blue">Filters</h2>
            <div className="mb-4">
              <label htmlFor="zip" className="block text-sm font-medium text-miami-blue">Zip Code</label>
              <input
                id="zip"
                type="text"
                className="w-full border rounded px-2 py-1 mt-1"
                placeholder="e.g. 33143, 33125"
                value={zipFilter}
                onChange={e => { setZipFilter(e.target.value); setPage(1); setTablePage(1); }}
                aria-label="Zip Code Filter"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="district" className="block text-sm font-medium text-miami-blue">District</label>
              <select
                id="district"
                className="w-full border rounded px-2 py-1 mt-1"
                value={districtFilter}
                onChange={e => { setDistrictFilter(e.target.value); setPage(1); setTablePage(1); }}
                aria-label="District Filter"
              >
                <option value="">All</option>
                {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="type" className="block text-sm font-medium text-miami-blue">Housing Type</label>
              <select
                id="type"
                className="w-full border rounded px-2 py-1 mt-1"
                value={typeFilter}
                onChange={e => { setTypeFilter(e.target.value); setPage(1); setTablePage(1); }}
                aria-label="Housing Type Filter"
              >
                <option value="">All</option>
                {HOUSING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="mb-4 flex items-center">
              <input
                id="senior"
                type="checkbox"
                className="mr-2"
                checked={seniorOnly}
                onChange={e => { setSeniorOnly(e.target.checked); setPage(1); setTablePage(1); }}
                aria-label="Senior Living Only"
              />
              <label htmlFor="senior" className="text-sm font-medium text-miami-blue">Senior Living Only</label>
            </div>
          </aside>
          {/* Topbar (mobile) */}
          <div className="md:hidden w-full p-4 border-b border-miami-gray bg-white">
            <button
              className="mb-2 px-4 py-2 bg-miami-blue text-white rounded focus:outline-none focus:ring-2 focus:ring-miami-teal"
              onClick={() => setFilterOpen(!filterOpen)}
              aria-expanded={filterOpen}
              aria-controls="mobile-filters"
            >
              {filterOpen ? 'Hide Filters' : 'Show Filters'}
            </button>
            {filterOpen && (
              <div id="mobile-filters" className="space-y-4">
                <div>
                  <label htmlFor="zip-m" className="block text-sm font-medium text-miami-blue">Zip Code</label>
                  <input
                    id="zip-m"
                    type="text"
                    className="w-full border rounded px-2 py-1 mt-1"
                    placeholder="e.g. 33143, 33125"
                    value={zipFilter}
                    onChange={e => { setZipFilter(e.target.value); setPage(1); setTablePage(1); }}
                    aria-label="Zip Code Filter"
                  />
                </div>
                <div>
                  <label htmlFor="district-m" className="block text-sm font-medium text-miami-blue">District</label>
                  <select
                    id="district-m"
                    className="w-full border rounded px-2 py-1 mt-1"
                    value={districtFilter}
                    onChange={e => { setDistrictFilter(e.target.value); setPage(1); setTablePage(1); }}
                    aria-label="District Filter"
                  >
                    <option value="">All</option>
                    {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="type-m" className="block text-sm font-medium text-miami-blue">Housing Type</label>
                  <select
                    id="type-m"
                    className="w-full border rounded px-2 py-1 mt-1"
                    value={typeFilter}
                    onChange={e => { setTypeFilter(e.target.value); setPage(1); setTablePage(1); }}
                    aria-label="Housing Type Filter"
                  >
                    <option value="">All</option>
                    {HOUSING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    id="senior-m"
                    type="checkbox"
                    className="mr-2"
                    checked={seniorOnly}
                    onChange={e => { setSeniorOnly(e.target.checked); setPage(1); setTablePage(1); }}
                    aria-label="Senior Living Only"
                  />
                  <label htmlFor="senior-m" className="text-sm font-medium text-miami-blue">Senior Living Only</label>
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <main className="flex-1 p-4" id="listings">
            {/* View Toggle */}
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-miami-blue">Housing Opportunities</h1>
              <div className="flex gap-2">
                <button
                  className={`px-3 py-1 rounded-l ${view === 'tile' ? 'bg-miami-blue text-white' : 'bg-miami-gray text-miami-blue'} focus:outline-none focus:ring-2 focus:ring-miami-teal`}
                  onClick={() => setView('tile')}
                  aria-pressed={view === 'tile'}
                >Tile View</button>
                <button
                  className={`px-3 py-1 rounded-r ${view === 'table' ? 'bg-miami-blue text-white' : 'bg-miami-gray text-miami-blue'} focus:outline-none focus:ring-2 focus:ring-miami-teal`}
                  onClick={() => setView('table')}
                  aria-pressed={view === 'table'}
                >Table View</button>
              </div>
            </div>

            {/* Listings */}
            {view === 'tile' ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pagedTileListings.length === 0 && (
                    <div className="col-span-full text-center text-gray-500">No listings found.</div>
                  )}
                  {pagedTileListings.map((l, i) => (
                    <div key={l.name + i} className="bg-white rounded shadow p-4 flex flex-col h-full border border-miami-gray" tabIndex={0} aria-label={`Listing: ${l.name}`}>
                      <div className="mb-2 h-28 flex items-center justify-center bg-miami-gray rounded">
                        {l.photo ? (
                          <img src={l.photo} alt={l.name + ' photo'} className="object-cover h-28 w-full rounded" />
                        ) : (
                          <div className="w-full h-28 flex items-center justify-center text-gray-400">No Photo</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-lg text-miami-blue mb-1">{l.name}</div>
                        <div className="text-sm text-gray-700 mb-1">{l.address}</div>
                        <div className="text-sm text-gray-700 mb-1"><span className="font-medium">Agent:</span> {l.agent}</div>
                        <div className="text-sm text-gray-700 mb-1"><span className="font-medium">Contact:</span> {l.contact}</div>
                        <div className="text-xs text-gray-500 mt-2">{l.district} | {l.zip} | {l.type} | {l.senior ? 'Senior Living' : 'All Ages'}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Pagination */}
                {tilePages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-6" aria-label="Pagination">
                    <button
                      className="px-2 py-1 rounded bg-miami-blue text-white disabled:opacity-50"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      aria-label="Previous Page"
                    >Previous</button>
                    {Array.from({ length: tilePages }, (_, i) => (
                      <button
                        key={i}
                        className={`px-2 py-1 rounded ${page === i + 1 ? 'bg-miami-teal text-white' : 'bg-miami-gray text-miami-blue'}`}
                        onClick={() => setPage(i + 1)}
                        aria-current={page === i + 1 ? 'page' : undefined}
                      >{i + 1}</button>
                    ))}
                    <button
                      className="px-2 py-1 rounded bg-miami-blue text-white disabled:opacity-50"
                      onClick={() => setPage(p => Math.min(tilePages, p + 1))}
                      disabled={page === tilePages}
                      aria-label="Next Page"
                    >Next</button>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table ref={tableRef} className="min-w-full bg-white border border-miami-gray print:bg-white print:text-black" aria-label="Listings Table">
                    <thead>
                      <tr>
                        <th className="px-2 py-2 cursor-pointer" onClick={() => handleSort('name')} scope="col">Development Name {sortCol === 'name' && (sortDir === 'asc' ? '▲' : '▼')}</th>
                        <th className="px-2 py-2 cursor-pointer" onClick={() => handleSort('address')} scope="col">Address {sortCol === 'address' && (sortDir === 'asc' ? '▲' : '▼')}</th>
                        <th className="px-2 py-2 cursor-pointer" onClick={() => handleSort('agent')} scope="col">Agent/Developer {sortCol === 'agent' && (sortDir === 'asc' ? '▲' : '▼')}</th>
                        <th className="px-2 py-2 cursor-pointer" onClick={() => handleSort('contact')} scope="col">Contact {sortCol === 'contact' && (sortDir === 'asc' ? '▲' : '▼')}</th>
                        <th className="px-2 py-2 cursor-pointer" onClick={() => handleSort('senior')} scope="col">Senior Living {sortCol === 'senior' && (sortDir === 'asc' ? '▲' : '▼')}</th>
                        <th className="px-2 py-2 cursor-pointer" onClick={() => handleSort('type')} scope="col">Housing Type {sortCol === 'type' && (sortDir === 'asc' ? '▲' : '▼')}</th>
                        <th className="px-2 py-2 cursor-pointer" onClick={() => handleSort('zip')} scope="col">Zip {sortCol === 'zip' && (sortDir === 'asc' ? '▲' : '▼')}</th>
                        <th className="px-2 py-2 cursor-pointer" onClick={() => handleSort('district')} scope="col">District {sortCol === 'district' && (sortDir === 'asc' ? '▲' : '▼')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedTableListings.length === 0 && (
                        <tr><td colSpan={8} className="text-center text-gray-500 py-4">No listings found.</td></tr>
                      )}
                      {pagedTableListings.map((l, i) => (
                        <tr key={l.name + i} className="hover:bg-miami-gray">
                          <td className="px-2 py-2 font-bold text-miami-blue">{l.name}</td>
                          <td className="px-2 py-2">{l.address}</td>
                          <td className="px-2 py-2">{l.agent}</td>
                          <td className="px-2 py-2">{l.contact}</td>
                          <td className="px-2 py-2">{l.senior ? 'Yes' : 'No'}</td>
                          <td className="px-2 py-2">{l.type}</td>
                          <td className="px-2 py-2">{l.zip}</td>
                          <td className="px-2 py-2">{l.district}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Table Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4">
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1 rounded bg-miami-blue text-white"
                      onClick={() => exportToCSV(filteredListings, 'listings.csv')}
                    >Export CSV</button>
                    <button
                      className="px-3 py-1 rounded bg-miami-blue text-white"
                      onClick={() => printTable(tableRef)}
                    >Print</button>
                  </div>
                  {/* Pagination */}
                  {tablePages > 1 && (
                    <div className="flex items-center gap-2" aria-label="Pagination">
                      <button
                        className="px-2 py-1 rounded bg-miami-blue text-white disabled:opacity-50"
                        onClick={() => setTablePage(p => Math.max(1, p - 1))}
                        disabled={tablePage === 1}
                        aria-label="Previous Page"
                      >Previous</button>
                      {Array.from({ length: tablePages }, (_, i) => (
                        <button
                          key={i}
                          className={`px-2 py-1 rounded ${tablePage === i + 1 ? 'bg-miami-teal text-white' : 'bg-miami-gray text-miami-blue'}`}
                          onClick={() => setTablePage(i + 1)}
                          aria-current={tablePage === i + 1 ? 'page' : undefined}
                        >{i + 1}</button>
                      ))}
                      <button
                        className="px-2 py-1 rounded bg-miami-blue text-white disabled:opacity-50"
                        onClick={() => setTablePage(p => Math.min(tablePages, p + 1))}
                        disabled={tablePage === tablePages}
                        aria-label="Next Page"
                      >Next</button>
                    </div>
                  )}
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-miami-blue text-white mt-auto py-6">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-2 text-center">
          <div className="font-bold text-lg">Contact Us: <a href="mailto:info@county.gov" className="underline">info@county.gov</a></div>
          <div className="text-sm">ADA Compliant | <a href="#" className="underline">Privacy Policy</a></div>
          <div className="flex gap-3 mt-2" aria-label="Social Media">
            <span>[FB]</span>
            <span>[TW]</span>
            <span>[IG]</span>
            <span>[LN]</span>
          </div>
        </div>
      </footer>

      {/* Print CSS */}
      <style>{`
        @media print {
          header, footer, aside, nav, .bg-miami-blue, .bg-miami-teal, .bg-miami-gray, .border-miami-gray, .shadow, .rounded, .focus\:ring-2, .focus\:ring-miami-teal, .hover\:bg-miami-gray, .print\:hidden { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; }
          table { background: #fff !important; color: #000 !important; }
        }
      `}</style>
    </div>
  );
};

export default HomePage; 