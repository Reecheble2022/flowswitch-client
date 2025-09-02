import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useItemsListReaderQuery, useItemsListReadrMutation, useItemFieldsUpdaterMutation } from '../backend/api/sharedCrud';
import { useSelector } from 'react-redux';
import { selectList } from "../backend/features/sharedMainState";
import DEFAULT_AVATAR from "../images/userRounded.png";
import DEFAULT_AVATAR2 from "../images/user.png";
import CompanyLogo from '../images/flowswitch-icon.png';
import DocumentList from './ui/documentList';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { useReactToPrint } from "react-to-print";
import * as XLSX from 'xlsx';

ModuleRegistry.registerModules([AllCommunityModule]);

const AgentList = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedMerchant, setSelectedMerchant] = useState("");
    const [selectedMerchantName, setSelectedMerchantName] = useState("All agents - not filtered");
    const [selectedSemester, setSelectedSemester] = useState("");
    const [expandedId, setExpandedId] = useState(null);
    const [page, setPage] = useState(1);
    const [inputPage, setInputPage] = useState("1");
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [editMerchants, setEditMerchants] = useState([]);
    const containerRef = useRef(null);
    const lastScrollTop = useRef(0);
    const componentRef = useRef();
    const [activeAgentsTypeFilter, setActiveAgentsTypeFilter] = useState("sales")

    // Build query filters
    const filters = useMemo(() => {
        const filterObj = {};
        if (selectedMerchant) {
            filterObj.merchantGuid = selectedMerchant;
        }
        return filterObj;
    }, [selectedMerchant]);

    const [fetchAgentsFn, {
        isLoading,
        isSuccess,
        isError,
        error,
    }] = useItemsListReadrMutation();

    const [previousMerchantFilter, setPreviousMerchantFilter] = useState(undefined);
    const [previousPage, setPreviousPage] = useState(0);
    useEffect(() => {
        if (selectedMerchant !== previousMerchantFilter || page !== previousPage) {
            fetchAgentsFn({ entity: "agent", max: 50, page, filters });
            setPreviousMerchantFilter(selectedMerchant);
            setPreviousPage(page);
        }
    }, [selectedMerchant, page, filters, fetchAgentsFn]);

    const {
        isLoading: merchantsLoading,
        isSuccess: merchantsSuccess,
        isError: merchantsError,
        error: merchantsErrorMsg
    } = useItemsListReaderQuery({ entity: "merchant" });

    const [updateAgent, { isLoading: isUpdating, isError: isUpdateError, error: updateError }] = useItemFieldsUpdaterMutation();

    const agents = useSelector(st => selectList(st, "agent")) || [];
    const merchants = useSelector(st => selectList(st, "merchant")) || [];

    // Filter agents by search term (all fields), merchant, and semester
    const filtered = agents.filter(agent => {
        const searchLower = searchTerm.toLowerCase();
        const fieldsToSearch = [
            agent.firstName || '',
            agent.lastName || '',
            agent.ussdCode || '',
            agent.email || '',
            agent.phone || '',
            agent.category || '',
            agent.nationality || '',
            agent.address || '',
            agent.merchants
                ?.filter(crs => crs.merchantGuid)
                .map(crs => crs.merchantGuid.merchantName)
                .join(', ') || '',
            agent.nationalId || '',
            agent.primaryPurpose || ''
        ];
        const matchesSearch = !searchTerm || fieldsToSearch.some(field => 
            field.toLowerCase().includes(searchLower)
        );
        return matchesSearch;
    });

    const toggleExpand = (id) => {
        setExpandedId(prev => (prev === id ? null : id));
        setEditingId(null); // Close edit mode when collapsing
    };

    const startEditing = (agent) => {
        setEditingId(agent.guid);
        setEditForm({
            firstName: agent.firstName,
            lastName: agent.lastName,
            phone: agent.phone,
            email: agent.email,
            address: agent.address,
            nationality: agent.nationality,
            primaryPurpose: agent.primaryPurpose,
        });
        setEditMerchants(agent.merchants?.map(merchant => merchant.merchantGuid?.guid) || []);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleMerchantChange = (merchantGuid) => {
        setEditMerchants(prev =>
            prev.includes(merchantGuid)
                ? prev.filter(id => id !== merchantGuid)
                : [...prev, merchantGuid]
        );
    };

    const handleSave = async (agentId) => {
        try {
            await updateAgent({
                entity: "agent",
                guid: agentId,
                data: {
                    ...editForm,
                    merchants: editMerchants
                }
            }).unwrap();
            setEditingId(null);
            setEditMerchants([]);
        } catch (err) {
            console.error("Failed to update agent:", err);
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({});
        setEditMerchants([]);
    };

    const handlePageInputChange = (e) => {
        const value = e.target.value;
        setInputPage(value);
        if (value === "" || isNaN(value) || parseInt(value) < 1) return;
        const newPage = parseInt(value);
        setPage(newPage);
    };

    const handleExportToExcel = () => {
        const exportData = filtered.map(agent => ({
            'Agent ID': agent.ussdCode || 'N/A',
            'First Name': agent.firstName || 'N/A',
            'Last Name': agent.lastName || 'N/A',
            'Category': agent.category || 'N/A',
            'Phone': agent.phone || 'N/A',
            'Email': agent.email || 'N/A',
            'Address': agent.address || 'N/A',
            'Nationality': agent.nationality || 'N/A',
            'National ID': agent.nationalId || 'N/A',
            'Primary purpose': agent.primaryPurpose || 'N/A',
            'Merchants': agent.merchants?.filter(crs => crs.merchantGuid)
                .map(crs => crs.merchantGuid.merchantName)
                .join(', ') || 'N/A',
            'Documents': agent.documents?.map(doc => doc.url).join(', ') || 'N/A'
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Agents');
        
        // Auto-size columns
        const colWidths = Object.keys(exportData[0]).map((key, i) => {
            const maxLength = Math.max(
                key.length,
                ...exportData.map(row => String(row[key]).length)
            );
            return { wch: Math.min(maxLength + 2, 50) };
        });
        worksheet['!cols'] = colWidths;

        XLSX.writeFile(workbook, `agents-list-${selectedMerchant || 'all'}.xlsx`);
    };

    const renderPrintable = (agent) => {
        if (!agent) return null;

        return (
            <div>
                <div className="flex justify-between items-center mb-6 gap-4">
                    <img src={CompanyLogo} alt="Company Logo" className="w-24 h-auto" />
                    <div className="gap-4">
                        <div className="text-5xl font-bold"> FlowSwitch agent </div>
                        <div className="text-3xl text-right"> Registration </div>
                    </div>
                </div>

                <div className="w-full mt-10 py-2 text-md text-justify">
                    You have been registered as an agent of Flowswitch, to handle float or sales transactions on behalf of flowswitch merchants
                </div>

                <div className="border border-gray-100 mt-6 rounded-lg">
                    <div className="flex flex-row justify-between mb-4 p-4 bg-lime-100 rounded-t-lg">
                        <h1 className="text-4xl font-bold my-auto">{agent.firstName} {agent.lastName}</h1>
                        <img src={agent.photo?.url ? `${agent.photo?.url}` : DEFAULT_AVATAR2} alt="Av" className="w-24 h-24 rounded-lg" />
                    </div>

                    <dl className="space-y-2 p-4">
                        <div className="flex flex-row justify-between">
                            <span className="text-lg"> Agent ID: </span>
                            <span className="text-lg font-bold"> {agent.ussdCode} </span>
                        </div>
                        <div className="flex flex-row justify-between">
                            <span className="text-lg"> Phone: </span>
                            <span className="text-lg font-bold"> {agent.phone} </span>
                        </div>
                        <div className="flex flex-row justify-between">
                            <span className="text-lg"> Category: </span>
                            <span className="text-lg font-bold"> {agent.category} </span>
                        </div>
                        <div className="flex flex-row justify-between">
                            <span className="text-lg"> Email: </span>
                            <span className="text-lg font-bold"> {agent.email} </span>
                        </div>
                        <div className="flex flex-row justify-between">
                            <span className="text-lg"> Address: </span>
                            <span className="text-lg font-bold"> {agent.address} </span>
                        </div>
                        <div className="flex flex-row justify-between">
                            <span className="text-lg"> Nationality: </span>
                            <span className="text-lg font-bold"> {agent.nationality} </span>
                        </div>
                    </dl>
                </div>
                <div className="w-full py-4">
                    {agent.merchants?.length && (
                        <div className="w-full"> Your chosen merchants: </div>
                    )}
                    {agent.merchants?.map((merchant, index) => (
                        <div key={index + 1} className="flex flex-row sm:flex-row justify-start gap-6">
                            <span className="font-medium text-gray-600">{index + 1}</span>
                            <span className="text-gray-800 ml-4"><b>{merchant.merchantGuid?.merchantName}</b></span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const [printableDetailsElement, setPrintableDetailsElement] = useState("to-be-printed");
    const [printableListElement, setPrintableListElement] = useState("to-be-printed");

    const handlePrint = (agent) => {
        setPrintableDetailsElement("printable-section");
        setPrintableListElement("to-be-printed"); 
        setExpandedId(agent.guid);
        setTimeout(() => window.print(), 100);
    };

    const handlePrintList = useReactToPrint({
        contentRef: componentRef,
        documentTitle: "agents-list-" + selectedMerchant,
    });

    const renderDetails = (agent) => {
        const details = {
            'Agent ID': agent.ussdCode,
            'Category': agent.category,
            'Phone': agent.phone,
            'Email': agent.email,
            'Address': agent.address,
            'Nationality': agent.nationality,
            'National ID': agent.nationalId,
            'Primary purpose': agent.primaryPurpose,
        };

        const { documents = [] } = agent || {};

        if (editingId === agent.guid) {
            return (
                <div className="bg-gray-50 px-3 py-4 rounded-b-md">
                    <div className="flex items-center gap-4 mb-4">
                        <img src={agent.photo?.url ? `${agent.photo?.url}` : DEFAULT_AVATAR2} alt="Av" className="w-16 h-16 rounded-xl" />
                        <div className="ml-auto flex gap-2">
                            <button
                                onClick={() => handleSave(agent.guid)}
                                disabled={isUpdating}
                                className="bg-green-600 text-white text-sm px-4 py-2 rounded hover:bg-green-700 transition disabled:opacity-50"
                            >
                                {isUpdating ? 'Saving...' : '💾 Save'}
                            </button>
                            <button
                                onClick={cancelEdit}
                                className="bg-gray-600 text-black text-sm px-4 py-2 rounded hover:bg-gray-700 transition border border-black"
                            >
                                ❌ Cancel
                            </button>
                        </div>
                    </div>
                    {isUpdateError && (
                        <div className="text-red-500 mb-4">
                            Error updating agent: {updateError?.message || 'Unknown error'}
                        </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600">First Name</label>
                            <input
                                type="text"
                                name="firstName"
                                value={editForm.firstName || ''}
                                onChange={handleEditChange}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-lime-400"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600">Last Name</label>
                            <input
                                type="text"
                                name="lastName"
                                value={editForm.lastName || ''}
                                onChange={handleEditChange}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-lime-400"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600">Phone</label>
                            <input
                                type="text"
                                name="phone"
                                value={editForm.phone || ''}
                                onChange={handleEditChange}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-lime-400"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={editForm.email || ''}
                                onChange={handleEditChange}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-lime-400"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600">Address</label>
                            <input
                                type="text"
                                name="address"
                                value={editForm.address || ''}
                                onChange={handleEditChange}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-lime-400"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600">Nationality</label>
                            <input
                                type="text"
                                name="nationality"
                                value={editForm.nationality || ''}
                                onChange={handleEditChange}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-lime-400"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600">Date of Birth</label>
                            <input
                                type="date"
                                name="dateOfBirth"
                                value={editForm.dateOfBirth || ''}
                                onChange={handleEditChange}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-lime-400"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-600">Primary purpose</label>
                            <textarea
                                name="primaryPurpose"
                                value={editForm.primaryPurpose || ''}
                                onChange={handleEditChange}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-lime-400"
                                rows="4"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-600">Merchant(s) Preferred</label>
                            {merchantsLoading && <div className="text-gray-500">Loading merchants...</div>}
                            {merchantsError && (
                                <div className="text-red-500">
                                    Error loading merchants: {merchantsErrorMsg?.message || 'Unknown error'}
                                </div>
                            )}
                            {merchantsSuccess && (
                                <div className="space-y-2">
                                    {merchants.map((merchant) => (
                                        <label key={merchant.guid} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                value={merchant.guid}
                                                checked={editMerchants.includes(merchant.guid)}
                                                onChange={() => handleMerchantChange(merchant.guid)}
                                                className="rounded text-lime-600 focus:ring-lime-500"
                                            />
                                            <span>{merchant.merchantName || merchant.guid}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <>
                <div className="bg-gray-50 px-3 py-4 rounded-b-md max-w-full">
                    <div className="flex items-center gap-4 mb-4">
                        <img src={agent.photo?.url ? `${agent.photo?.url}` : DEFAULT_AVATAR2} alt="Av" className="w-16 h-16 rounded-xl" />
                        <div className="ml-auto flex gap-2">
                            <button
                                onClick={() => startEditing(agent)}
                                className="bg-yellow-600 text-black text-sm px-4 py-2 rounded hover:bg-yellow-700 transition border border-black"
                            >
                                ✏️ Edit
                            </button>
                            <button
                                onClick={() => handlePrint(agent)}
                                className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 transition"
                            >
                                🖨️ Print
                            </button>
                        </div>
                    </div>
                    <dl className="space-y-2 text-sm text-gray-700">
                        {Object.entries(details).map(([key, value]) => (
                            <div key={key} className="flex flex-row justify-between">
                                <dt className="font-medium text-gray-600">{key}</dt>
                                <dd className="text-gray-800 ml-4"><b>{value || 'N/A'}</b></dd>
                            </div>
                        ))}
                    </dl>
                </div>
                <div className="w-full p-3">
                    <div className="w-full"> Merchants:</div>
                    {agent.merchants?.filter(crs => crs.merchantGuid)?.map((merchant, index) => (
                        <div key={index + 1} className="flex flex-row sm:flex-row justify-start gap-6">
                            <span className="font-medium text-gray-600">{index + 1}</span>
                            <span className="text-gray-800 ml-4"><b>{merchant.merchantGuid?.merchantName}</b></span>
                        </div>
                    ))}
                </div>

                <DocumentList documents={documents.map(doc => doc.url)} />

                <div id={printableDetailsElement} className="hidden print:block bg-white p-6 text-sm">
                    {expandedId && renderPrintable(agents.find(a => a.guid === expandedId))}
                </div>
            </>
        );
    };

    return (
        <div className="w-full p-6 bg-white rounded-xl shadow-lg">
            <h2 className="text-2xl font-semibold mb-4 text-center text-gray-800 no-print">Agents List</h2>

            <div className="space-y-4 mb-4 no-print">
                <div className="flex flex-row justify-between">
                    <div className="w-[60%] lg:w-[70%]">
                        <input
                            type="text"
                            placeholder="Search by any field..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-lime-400"
                        />
                    </div>
                    <div className="border border-gray-300 rounded flex-row justify-between pl-[1%]">
                        <span>Chunk </span>
                        <input
                            type="number"
                            min={1}
                            value={inputPage}
                            onChange={handlePageInputChange}
                            className="w-10 px-1 py-2 focus:outline-none focus:ring-2 focus:ring-lime-400 rounded"
                            placeholder="Page"
                            disabled={isLoading}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Filter by Merchant</label>
                    <select
                        value={selectedMerchant}
                        onChange={(e) => {
                            const selectedGuid = e.target.value;
                            setSelectedMerchant(selectedGuid);
                            const selectedMerchantObj = merchants.find(merchant => merchant.guid === selectedGuid);
                            setSelectedMerchantName(selectedMerchantObj ? selectedMerchantObj.merchantName : "");
                        }}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-lime-400"
                        disabled={merchantsLoading}
                    >
                        <option value="">All Merchants</option>
                        {merchants.map(merchant => (
                            <option key={merchant.guid} value={merchant.guid}>{merchant.merchantName}</option>
                        ))}
                    </select>
                    {merchantsError && (
                        <div className="text-red-500 text-sm mt-1">
                            Error loading merchants: {merchantsErrorMsg?.message || 'Unknown error'}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-between gap-2 mt-8">
                <div className="flex justify-start gap-2">
                    <button 
                        onClick={()=>setActiveAgentsTypeFilter("sales")}
                        className={`${activeAgentsTypeFilter === "sales"? "bg-blue-400 text-white" : "border text-black"} text-sm px-4 py-2 rounded hover:bg-blue-600 hover:text-white transition mb-3`}
                    >
                        Sales agents
                    </button>
                    <button
                        onClick={()=>setActiveAgentsTypeFilter("float")}
                        className={`${activeAgentsTypeFilter === "float"? "bg-blue-400 text-white" : "border text-black"} text-sm px-4 py-2 rounded hover:bg-blue-600 hover:text-white transition mb-3`}
                    >
                        Float Agents
                    </button>
                </div>
                <div className="flex justify-end gap-2">
                    <button 
                        onClick={(e) => {
                            setExpandedId(null);
                            setPrintableDetailsElement("to-be-printed");
                            setPrintableListElement("printable-list");
                            setTimeout(() => handlePrintList(e), 200);
                        }}
                        className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 transition mb-3"
                    >
                        🖨️ Print List
                    </button>
                    <button
                        onClick={handleExportToExcel}
                        className="bg-green-600 text-white text-sm px-4 py-2 rounded hover:bg-green-700 transition mb-3"
                    >
                        📊 Export to Excel
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-md max-h-[140vh]">
                <div id={printableListElement} ref={componentRef}>
                    <div className="w-full hidden print:block">
                        <div className="flex justify-between items-center mb-6 gap-4">
                            <img src={CompanyLogo} alt="Company Logo" className="w-24 h-auto" />
                            <div className="gap-4">
                                <div className="text-5xl font-bold"> FlowSwitch agents </div>
                                <div className="text-3xl text-right"> List </div>
                            </div>
                        </div>
                        <div className="w-full mt-10 mb-4 py-2 text-xl text-justify">
                            <b> {selectedMerchantName} - (chunk {page})</b>
                        </div>
                    </div>
                    <table className="min-w-full table-auto">
                        <thead className="top-0 bg-zinc-200">
                            <tr>
                                <th className="text-left p-1 border-b border-gray-600 font-medium text-gray-700">Photo</th>
                                <th className="text-left p-1 border-b border-gray-600 font-medium text-gray-700">First Name</th>
                                <th className="text-left p-1 border-b border-gray-600 font-medium text-gray-700">Last Name</th>
                                <th className="text-left p-1 border-b border-gray-600 font-medium text-gray-700">Category</th>
                                <th className="text-left p-1 border-b border-gray-600 font-medium text-gray-700">Agent ID</th>
                                <th className="text-left p-1 border-b border-gray-600 font-medium text-gray-700">Phone</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((agent, index) => (
                                <React.Fragment key={index + 1}>
                                    <tr
                                        onClick={() => toggleExpand(agent.guid)}
                                        className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                                            ((index + 1) === 25) || (index + 1 > 24 && (index + 1 - 24) % 27 === 0) ? 'page-break avoid-break' : ''
                                        }`}
                                    >
                                        <td className="p-1 border-t border-gray-400">
                                            <img
                                                src={agent.photo?.url ? `${agent.photo?.url}` : DEFAULT_AVATAR}
                                                alt="Avatar"
                                                className="w-6 h-6 rounded-full"
                                                onError={(e) => (e.target.src = DEFAULT_AVATAR)}
                                            />
                                        </td>
                                        <td className="p-1 border-t border-gray-600 text-sm text-gray-800">{agent.firstName || 'N/A'}</td>
                                        <td className="p-1 border-t border-gray-600 text-sm text-gray-800">{agent.lastName || 'N/A'}</td>
                                        <td className="p-1 border-t border-gray-600 text-sm text-gray-800">{agent.category || 'N/A'}</td>
                                        <td className="p-1 border-t border-gray-600 text-sm text-gray-800">{agent.ussdCode || 'N/A'}</td>
                                        <td className="p-1 border-t border-gray-600 text-sm text-gray-800">{agent.phone || 'N/A'}</td>
                                    </tr>
                                    {expandedId === agent.guid && (
                                        <tr className="bg-white no-print">
                                            <td colSpan="5">{renderDetails(agent)}</td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                            {!filtered.length && !isLoading && (
                                <tr>
                                    <td colSpan="5" className="text-center py-4 text-gray-500">No agents found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {isLoading && (
                    <div className="text-center py-4 text-gray-500 no-print">Loading...</div>
                )}
                {isError && (
                    <div className="text-center py-4 text-red-500 no-print">
                        ❌ Error: {error?.message || 'Failed to load agents.'}
                    </div>
                )}
            </div>

            {/* 
            <div className="flex justify-end gap-2 mt-8">
                <button onClick={(e) => {
                        setExpandedId(null);
                        setPrintableDetailsElement("to-be-printed");
                        setPrintableListElement("printable-list");
                        setTimeout(() => handlePrintList(e), 200);
                    }}
                    className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 transition mb-3"
                >
                    🖨️ Print List
                </button>
                <button
                    onClick={handleExportToExcel}
                    className="bg-green-600 text-white text-sm px-4 py-2 rounded hover:bg-green-700 transition mb-3"
                >
                    📊 Export to Excel
                </button>
            </div> 
            */}

        </div>
    );
};

export default AgentList;