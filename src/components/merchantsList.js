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

const MerchantList = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedAgent, setSelectedAgent] = useState("");
    const [selectedAgentName, setSelectedAgentName] = useState("All merchants - not filtered");
    const [selectedSemester, setSelectedSemester] = useState("");
    const [expandedId, setExpandedId] = useState(null);
    const [page, setPage] = useState(1);
    const [inputPage, setInputPage] = useState("1");
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [editAgents, setEditAgents] = useState([]);
    const componentRef = useRef();

    // Build query filters
    const filters = useMemo(() => {
        const filterObj = {};
        if (selectedAgent) {
            filterObj.agentGuid = selectedAgent;
        }
        return filterObj;
    }, [selectedAgent, selectedSemester]);

    const [fetchMerchantsFn, {
        isLoading,
        isSuccess,
        isError,
        error,
    }] = useItemsListReadrMutation();

    const [previousAgentFilter, setPreviousAgentFilter] = useState(undefined);
    const [previousPage, setPreviousPage] = useState(0);
    useEffect(() => {
        if (selectedAgent !== previousAgentFilter || page !== previousPage) {
            fetchMerchantsFn({ entity: "merchant", max: 50, page, filters });
            setPreviousAgentFilter(selectedAgent);
            setPreviousPage(page);
        }
    }, [selectedAgent, page, filters, fetchMerchantsFn]);

    const {
        isLoading: agentsLoading,
        isSuccess: agentsSuccess,
        isError: agentsError,
        error: agentsErrorMsg
    } = useItemsListReaderQuery({ entity: "agent" });

    const [updateMerchant, { isLoading: isUpdating, isError: isUpdateError, error: updateError }] = useItemFieldsUpdaterMutation();

    const merchants = useSelector(st => selectList(st, "merchant")) || [];
    const agents = useSelector(st => selectList(st, "agent")) || [];

    // Filter merchants by search term (all fields), agent, and semester
    const filtered = merchants.filter(merchant => {
        const searchLower = searchTerm.toLowerCase();
        const fieldsToSearch = [
            merchant.firstName || '',
            merchant.lastName || '',
            merchant.merchantId || '',
            merchant.email || '',
            merchant.phone || '',
            merchant.gender || '',
            merchant.nationality || '',
            merchant.physicalAddress || '',
            merchant.agents
                ?.filter(crs => crs.agentGuid)
                .map(crs => crs.agentGuid.agentName)
                .join(', ') || '',
            merchant.maritalStatus || '',
            merchant.nationalId || '',
            merchant.description || ''
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

    const startEditing = (merchant) => {
        setEditingId(merchant.guid);
        setEditForm({
            firstName: merchant.firstName,
            lastName: merchant.lastName,
            phone: merchant.phone,
            email: merchant.email,
            physicalAddress: merchant.physicalAddress,
            nationality: merchant.nationality,
            maritalStatus: merchant.maritalStatus,
            description: merchant.description,
        });
        setEditAgents(merchant.agents?.map(agent => agent.agentGuid?.guid) || []);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleAgentChange = (agentGuid) => {
        setEditAgents(prev =>
            prev.includes(agentGuid)
                ? prev.filter(id => id !== agentGuid)
                : [...prev, agentGuid]
        );
    };

    const handleSave = async (merchantId) => {
        try {
            await updateMerchant({
                entity: "merchant",
                guid: merchantId,
                data: {
                    ...editForm,
                    agents: editAgents
                }
            }).unwrap();
            setEditingId(null);
            setEditAgents([]);
        } catch (err) {
            console.error("Failed to update merchant:", err);
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({});
        setEditAgents([]);
    };

    const handlePageInputChange = (e) => {
        const value = e.target.value;
        setInputPage(value);
        if (value === "" || isNaN(value) || parseInt(value) < 1) return;
        const newPage = parseInt(value);
        setPage(newPage);
    };

    const handleExportToExcel = () => {
        const exportData = filtered.map(merchant => ({
            'Merchant ID': merchant.merchantId || 'N/A',
            'First Name': merchant.firstName || 'N/A',
            'Last Name': merchant.lastName || 'N/A',
            'Gender': merchant.gender || 'N/A',
            'Phone': merchant.phone || 'N/A',
            'Email': merchant.email || 'N/A',
            'Address': merchant.physicalAddress || 'N/A',
            'Nationality': merchant.nationality || 'N/A',
            'National ID': merchant.nationalId || 'N/A',
            'Marital Status': merchant.maritalStatus || 'N/A',
            'Description': merchant.description || 'N/A',
            'Agents': merchant.agents?.filter(crs => crs.agentGuid)
                .map(crs => crs.agentGuid.agentName)
                .join(', ') || 'N/A',
            'Documents': merchant.documents?.map(doc => doc.url).join(', ') || 'N/A'
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Merchants');
        
        // Auto-size columns
        const colWidths = Object.keys(exportData[0]).map((key, i) => {
            const maxLength = Math.max(
                key.length,
                ...exportData.map(row => String(row[key]).length)
            );
            return { wch: Math.min(maxLength + 2, 50) };
        });
        worksheet['!cols'] = colWidths;

        XLSX.writeFile(workbook, `merchants-list-${selectedAgent || 'all'}.xlsx`);
    };

    const renderPrintable = (merchant) => {
        if (!merchant) return null;

        return (
            <div>
                <div className="flex justify-between items-center mb-6 gap-4">
                    <img src={CompanyLogo} alt="Company Logo" className="w-24 h-auto" />
                    <div className="gap-4">
                        <div className="text-5xl font-bold"> FlowSwitch merchants </div>
                        <div className="text-3xl text-right"> Registration </div>
                    </div>
                </div>

                <div className="w-full mt-10 py-2 text-md text-justify">
                    You have been registered as an agent of Flowswitch, to handle float or sales transactions on behalf of flowswitch merchants
                </div>

                <div className="border border-gray-100 mt-6 rounded-lg">
                    <div className="flex flex-row justify-between mb-4 p-4 bg-lime-100 rounded-t-lg">
                        <h1 className="text-4xl font-bold my-auto">{merchant.firstName} {merchant.lastName}</h1>
                        <img src={merchant.photo?.url ? `${merchant.photo?.url}` : DEFAULT_AVATAR2} alt="Av" className="w-24 h-24 rounded-lg" />
                    </div>

                    <dl className="space-y-2 p-4">
                        <div className="flex flex-row justify-between">
                            <span className="text-lg"> Merchant ID: </span>
                            <span className="text-lg font-bold"> {merchant.merchantId} </span>
                        </div>
                        <div className="flex flex-row justify-between">
                            <span className="text-lg"> Phone: </span>
                            <span className="text-lg font-bold"> {merchant.phone} </span>
                        </div>
                        <div className="flex flex-row justify-between">
                            <span className="text-lg"> Gender: </span>
                            <span className="text-lg font-bold"> {merchant.gender} </span>
                        </div>
                        <div className="flex flex-row justify-between">
                            <span className="text-lg"> Email: </span>
                            <span className="text-lg font-bold"> {merchant.email} </span>
                        </div>
                        <div className="flex flex-row justify-between">
                            <span className="text-lg"> Address: </span>
                            <span className="text-lg font-bold"> {merchant.physicalAddress} </span>
                        </div>
                        <div className="flex flex-row justify-between">
                            <span className="text-lg"> Nationality: </span>
                            <span className="text-lg font-bold"> {merchant.nationality} </span>
                        </div>
                    </dl>
                </div>
                <div className="w-full py-4">
                    {merchant.agents?.length && (
                        <div className="w-full"> Your chosen agents: </div>
                    )}
                    {merchant.agents?.map((agent, index) => (
                        <div key={index + 1} className="flex flex-row sm:flex-row justify-start gap-6">
                            <span className="font-medium text-gray-600">{index + 1}</span>
                            <span className="text-gray-800 ml-4"><b>{agent.agentGuid?.agentName}</b></span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const [printableDetailsElement, setPrintableDetailsElement] = useState("to-be-printed");
    const [printableListElement, setPrintableListElement] = useState("to-be-printed");

    const handlePrint = (merchant) => {
        setPrintableDetailsElement("printable-section");
        setPrintableListElement("to-be-printed"); 
        setExpandedId(merchant.guid);
        setTimeout(() => window.print(), 100);
    };

    const handlePrintList = useReactToPrint({
        contentRef: componentRef,
        documentTitle: "merchants-list-" + selectedAgent,
    });

    const renderDetails = (merchant) => {
        const details = {
            'Merchant ID': merchant.merchantId,
            'Gender': merchant.gender,
            'Phone': merchant.phone,
            'Email': merchant.email,
            'Address': merchant.physicalAddress,
            'Nationality': merchant.nationality,
            'National ID': merchant.nationalId,
            'Description': merchant.description,
        };

        const { documents = [] } = merchant || {};

        if (editingId === merchant.guid) {
            return (
                <div className="bg-gray-50 px-3 py-4 rounded-b-md">
                    <div className="flex items-center gap-4 mb-4">
                        <img src={merchant.photo?.url ? `${merchant.photo?.url}` : DEFAULT_AVATAR2} alt="Av" className="w-16 h-16 rounded-xl" />
                        <div className="ml-auto flex gap-2">
                            <button
                                onClick={() => handleSave(merchant.guid)}
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
                            Error updating merchant: {updateError?.message || 'Unknown error'}
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
                                name="physicalAddress"
                                value={editForm.physicalAddress || ''}
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
                            <label className="block text-sm font-medium text-gray-600">Marital Status</label>
                            <select
                                name="maritalStatus"
                                value={editForm.maritalStatus || ''}
                                onChange={handleEditChange}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-lime-400"
                            >
                                <option value="">Select</option>
                                <option value="Single">Single</option>
                                <option value="Married">Married</option>
                                <option value="Divorced">Divorced</option>
                                <option value="Widowed">Widowed</option>
                            </select>
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
                            <label className="block text-sm font-medium text-gray-600">Description</label>
                            <textarea
                                name="description"
                                value={editForm.description || ''}
                                onChange={handleEditChange}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-lime-400"
                                rows="4"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-600">Agent(s) Preferred</label>
                            {agentsLoading && <div className="text-gray-500">Loading agents...</div>}
                            {agentsError && (
                                <div className="text-red-500">
                                    Error loading agents: {agentsErrorMsg?.message || 'Unknown error'}
                                </div>
                            )}
                            {agentsSuccess && (
                                <div className="space-y-2">
                                    {agents.map((agent) => (
                                        <label key={agent.guid} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                value={agent.guid}
                                                checked={editAgents.includes(agent.guid)}
                                                onChange={() => handleAgentChange(agent.guid)}
                                                className="rounded text-lime-600 focus:ring-lime-500"
                                            />
                                            <span>{agent.agentName || agent.guid}</span>
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
                <div className="bg-gray-50 px-3 py-4 rounded-b-md max-w-300">
                    <div className="flex items-center gap-4 mb-4">
                        <img src={merchant.photo?.url ? `${merchant.photo?.url}` : DEFAULT_AVATAR2} alt="Av" className="w-16 h-16 rounded-xl" />
                        <div className="ml-auto flex gap-2">
                            <button
                                onClick={() => startEditing(merchant)}
                                className="bg-yellow-600 text-black text-sm px-4 py-2 rounded hover:bg-yellow-700 transition border border-black"
                            >
                                ✏️ Edit
                            </button>
                            <button
                                onClick={() => handlePrint(merchant)}
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
                    <div className="w-full"> Agents:</div>
                    {merchant.agents?.filter(crs => crs.agentGuid)?.map((agent, index) => (
                        <div key={index + 1} className="flex flex-row sm:flex-row justify-start gap-6">
                            <span className="font-medium text-gray-600">{index + 1}</span>
                            <span className="text-gray-800 ml-4"><b>{agent.agentGuid?.agentName}</b></span>
                        </div>
                    ))}
                </div>

                <DocumentList documents={documents.map(doc => doc.url)} />

                <div id={printableDetailsElement} className="hidden print:block bg-white p-6 text-sm">
                    {expandedId && renderPrintable(merchants.find(a => a.guid === expandedId))}
                </div>
            </>
        );
    };

    return (
        <div className="w-full p-6 bg-white rounded-xl shadow-lg md:max-w-[500px]">
            <h2 className="text-2xl font-semibold mb-4 text-center text-gray-800 no-print">Merchants List</h2>

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
                    <label className="block text-sm font-medium text-gray-600 mb-1">Filter by Agent</label>
                    <select
                        value={selectedAgent}
                        onChange={(e) => {
                            const selectedGuid = e.target.value;
                            setSelectedAgent(selectedGuid);
                            const selectedAgentObj = agents.find(agent => agent.guid === selectedGuid);
                            setSelectedAgentName(selectedAgentObj ? selectedAgentObj.agentName : "");
                        }}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-lime-400"
                        disabled={agentsLoading}
                    >
                        <option value="">All Agents</option>
                        {agents.map(agent => (
                            <option key={agent.guid} value={agent.guid}>{agent.agentName}</option>
                        ))}
                    </select>
                    {agentsError && (
                        <div className="text-red-500 text-sm mt-1">
                            Error loading agents: {agentsErrorMsg?.message || 'Unknown error'}
                        </div>
                    )}
                </div>
            </div>

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

            <div className="overflow-x-auto border border-gray-200 rounded-md max-h-[140vh]">
                <div id={printableListElement} ref={componentRef}>
                    <div className="w-full hidden print:block">
                        <div className="flex justify-between items-center mb-6 gap-4">
                            <img src={CompanyLogo} alt="Company Logo" className="w-24 h-auto" />
                            <div className="gap-4">
                                <div className="text-5xl font-bold"> FlowSwitch merchants </div>
                                <div className="text-3xl text-right"> List </div>
                            </div>
                        </div>
                        <div className="w-full mt-10 mb-4 py-2 text-xl text-justify">
                            <b> {selectedAgentName} - (chunk {page})</b>
                        </div>
                    </div>
                    <table className="min-w-[500px] table-auto">
                        <thead className="top-0 bg-zinc-200">
                            <tr>
                                <th className="text-left p-1 border-b border-gray-600 font-medium text-gray-700">Photo</th>
                                <th className="text-left p-1 border-b border-gray-600 font-medium text-gray-700">First Name</th>
                                <th className="text-left p-1 border-b border-gray-600 font-medium text-gray-700">Last Name</th>
                                <th className="text-left p-1 border-b border-gray-600 font-medium text-gray-700">Gender</th>
                                <th className="text-left p-1 border-b border-gray-600 font-medium text-gray-700">Merchant ID</th>
                                <th className="text-left p-1 border-b border-gray-600 font-medium text-gray-700">Phone</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((merchant, index) => (
                                <React.Fragment key={index + 1}>
                                    <tr
                                        onClick={() => toggleExpand(merchant.guid)}
                                        className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                                            ((index + 1) === 25) || (index + 1 > 24 && (index + 1 - 24) % 27 === 0) ? 'page-break avoid-break' : ''
                                        }`}
                                    >
                                        <td className="p-1 border-t border-gray-400">
                                            <img
                                                src={merchant.photo?.url ? `${merchant.photo?.url}` : DEFAULT_AVATAR}
                                                alt="Avatar"
                                                className="w-6 h-6 rounded-full"
                                                onError={(e) => (e.target.src = DEFAULT_AVATAR)}
                                            />
                                        </td>
                                        <td className="p-1 border-t border-gray-600 text-sm text-gray-800">{merchant.firstName || 'N/A'}</td>
                                        <td className="p-1 border-t border-gray-600 text-sm text-gray-800">{merchant.lastName || 'N/A'}</td>
                                        <td className="p-1 border-t border-gray-600 text-sm text-gray-800">{merchant.gender || 'N/A'}</td>
                                        <td className="p-1 border-t border-gray-600 text-sm text-gray-800">{merchant.merchantId || 'N/A'}</td>
                                        <td className="p-1 border-t border-gray-600 text-sm text-gray-800">{merchant.phone || 'N/A'}</td>
                                    </tr>
                                    {expandedId === merchant.guid && (
                                        <tr className="bg-white no-print">
                                            <td colSpan="5">{renderDetails(merchant)}</td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                            {!filtered.length && !isLoading && (
                                <tr>
                                    <td colSpan="5" className="text-center py-4 text-gray-500">No merchants found.</td>
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
                        ❌ Error: {error?.message || 'Failed to load merchants.'}
                    </div>
                )}
            </div>

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

        </div>
    );
};

export default MerchantList;