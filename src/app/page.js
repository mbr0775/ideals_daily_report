"use client";

import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Image from 'next/image';
import logo from './assets/idealscontractinglogo.jpg';
import { supabase } from './lib/supabase';

export default function Home() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [formData, setFormData] = useState({
    company: '',
    contact: '',
    address: '',
    follow_up_date: '',
    appointments: '',
    remarks: '',
    attendees: [] // Array for multiple selections
  });

  const defaultAttendees = ['Bismillah', 'Mubassir', 'Riswan', 'Hanees'];

  // Fetch entries from Supabase on component mount
  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('work_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Convert string attendees to array if necessary
      const formattedData = data.map(entry => ({
        ...entry,
        attendees: Array.isArray(entry.attendees) ? entry.attendees : entry.attendees ? entry.attendees.split(',') : []
      }));
      setEntries(formattedData || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
      alert('Error loading entries. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Field ${name} changed to:`, value);
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.company.trim()) {
      alert('Please enter a client/prospect company name');
      return;
    }

    try {
      setSubmitting(true);
      const { data, error } = await supabase
        .from('work_entries')
        .insert([
          {
            company: formData.company,
            contact: formData.contact,
            address: formData.address,
            follow_up_date: formData.follow_up_date,
            appointments: formData.appointments,
            remarks: formData.remarks,
            attendees: formData.attendees.join(',') // Store as comma-separated string
          }
        ])
        .select();

      if (error) throw error;

      console.log('New entry added:', data[0]);
      
      setEntries(prev => [data[0], ...prev]);
      
      setFormData({
        company: '',
        contact: '',
        address: '',
        follow_up_date: '',
        appointments: '',
        remarks: '',
        attendees: []
      });

      const addSuccessMsg = document.createElement('div');
      addSuccessMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300';
      addSuccessMsg.innerHTML = '✅ Lead entry added successfully!';
      document.body.appendChild(addSuccessMsg);
      
      setTimeout(() => {
        addSuccessMsg.remove();
      }, 3000);
    } catch (error) {
      console.error('Error adding entry:', error);
      alert('Error adding entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (entry) => {
    setFormData({
      company: entry.company,
      contact: entry.contact || '',
      address: entry.address || '',
      follow_up_date: entry.follow_up_date || '',
      appointments: entry.appointments || '',
      remarks: entry.remarks || '',
      attendees: Array.isArray(entry.attendees) ? entry.attendees : entry.attendees ? entry.attendees.split(',') : []
    });
    
    try {
      const { error } = await supabase
        .from('work_entries')
        .delete()
        .eq('id', entry.id);

      if (error) throw error;

      setEntries(prev => prev.filter(e => e.id !== entry.id));

      const editSuccessMsg = document.createElement('div');
      editSuccessMsg.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300';
      editSuccessMsg.innerHTML = '📝 Entry loaded for editing. Make changes and click "Add Lead Entry" to save.';
      document.body.appendChild(editSuccessMsg);
      
      setTimeout(() => {
        editSuccessMsg.remove();
      }, 4000);
    } catch (error) {
      console.error('Error preparing edit:', error);
      alert('Error preparing edit. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      try {
        const { error } = await supabase
          .from('work_entries')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setEntries(prev => prev.filter(entry => entry.id !== id));
        
        const deleteSuccessMsg = document.createElement('div');
        deleteSuccessMsg.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300';
        deleteSuccessMsg.innerHTML = '🗑️ Entry deleted successfully!';
        document.body.appendChild(deleteSuccessMsg);
        
        setTimeout(() => {
          deleteSuccessMsg.remove();
        }, 3000);
      } catch (error) {
        console.error('Error deleting entry:', error);
        alert('Error deleting entry. Please try again.');
      }
    }
  };

  const exportToPDF = () => {
    if (entries.length === 0) {
      alert('No entries to export');
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      
      doc.setFontSize(22);
      doc.setTextColor(102, 0, 51);
      doc.text('IDEALS CONTRACTING', 20, 25);
      
      doc.setFontSize(14);
      doc.setTextColor(100, 100, 100);
      doc.text('Marketing Department Lead Tracker Report', 20, 38);
      
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, 48);
      
      doc.setDrawColor(102, 0, 51);
      doc.setLineWidth(1);
      doc.line(20, 55, pageWidth - 20, 55);
      
      const tableData = entries.map((entry, index) => {
        const company = String(entry.company || '-').trim();
        const contact = String(entry.contact || '-').trim();
        const address = String(entry.address || '-').trim();
        const follow_up_date = entry.follow_up_date ? new Date(entry.follow_up_date).toLocaleDateString() : '-';
        const appointments = String(entry.appointments || '-').trim();
        const attendees = Array.isArray(entry.attendees) ? entry.attendees.join(', ') : entry.attendees || '-';
        const remarks = String(entry.remarks || '-').trim();
        
        console.log(`Entry ${index + 1}:`, {
          company, contact, address, follow_up_date, appointments, attendees, remarks
        });
        
        return [
          company,
          contact,
          address,
          follow_up_date,
          appointments,
          attendees,
          remarks
        ];
      });
      
      autoTable(doc, {
        startY: 65,
        head: [['Client/Prospect', 'Key Contact', 'Project Location', 'Follow-up Date', 'Follow-up Schedule', 'Marketing Reps', 'Lead Status & Notes']],
        body: tableData,
        theme: 'striped',
        styles: {
          fontSize: 8,
          cellPadding: 3,
          valign: 'top',
          overflow: 'linebreak',
          minCellHeight: 12,
          textColor: [0, 0, 0]
        },
        headStyles: {
          fillColor: [102, 0, 51],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle'
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        columnStyles: {
          0: { 
            cellWidth: 28, 
            fontStyle: 'bold',
            textColor: [102, 0, 51]
          },
          1: { cellWidth: 24 },
          2: { cellWidth: 28 },
          3: { cellWidth: 20 },
          4: { cellWidth: 28 },
          5: { 
            cellWidth: 24,
            fillColor: [240, 248, 255],
            fontStyle: 'bold'
          },
          6: { cellWidth: 43 }
        },
        margin: { left: 10, right: 10 },
        didDrawPage: function (data) {
          doc.setFontSize(8);
          doc.setTextColor(120, 120, 120);
          const footerY = doc.internal.pageSize.height - 15;
          doc.text(`Total Leads: ${entries.length}`, 15, footerY);
          doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth - 30, footerY);
          doc.text('Ideals Contracting - Marketing Department', pageWidth / 2 - 40, footerY);
        }
      });
      
      const today = new Date();
      const dateStr = today.getFullYear() + '-' + 
                     String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(today.getDate()).padStart(2, '0');
      const fileName = `Ideals_Contracting_Marketing_Leads_${dateStr}.pdf`;
      doc.save(fileName);
      
      const exportSuccessMsg = document.createElement('div');
      exportSuccessMsg.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300';
      exportSuccessMsg.innerHTML = '📄 PDF exported successfully!';
      document.body.appendChild(exportSuccessMsg);
      
      setTimeout(() => {
        exportSuccessMsg.remove();
      }, 3000);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const EditIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );

  const DeleteIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );

  const HamburgerIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );

  const CloseIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  const ArrowDownIcon = () => (
    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#660033] to-[#440022] shadow-lg relative">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="md:bg-white/10 md:backdrop-blur-sm md:rounded-full md:p-3 md:shadow-lg md:border md:border-white/20 flex-shrink-0">
                <Image 
                  src={logo}
                  alt="Ideals Contracting Logo" 
                  width={32}
                  height={32}
                  className="object-contain rounded-full"
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl md:text-3xl font-bold text-white tracking-wide truncate">
                  Ideals Contracting
                </h1>
                <p className="text-white/80 text-xs md:text-sm font-medium mt-1 tracking-wide hidden sm:block">
                  Marketing Department Analyse Tracker
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                <div className="text-white/60 text-xs uppercase tracking-widest font-semibold">
                  Today
                </div>
                <div className="text-white text-sm font-medium">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                <div className="text-white/60 text-xs uppercase tracking-widest font-semibold">
                  Entries
                </div>
                <div className="text-white text-sm font-medium">
                  {entries.length}
                </div>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-white/20 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
                  <div className="text-white/60 text-xs uppercase tracking-widest font-semibold">
                    Today
                  </div>
                  <div className="text-white text-sm font-medium">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
                  <div className="text-white/60 text-xs uppercase tracking-widest font-semibold">
                    Entries
                  </div>
                  <div className="text-white text-sm font-medium">
                    {entries.length}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 md:p-6">
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-[#660033] font-semibold mb-4">🎯 Add New Lead/Prospect Entry</h2>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">🏢 Client/Prospect Company *</label>
                <input 
                  type="text" 
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  placeholder="Enter target company name" 
                  className="mt-1 p-2 w-full border border-gray-300 rounded-lg focus:border-[#660033] focus:ring-[#660033] placeholder-gray-400 text-black" 
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">📞 Key Contact Person</label>
                <input 
                  type="text" 
                  name="contact"
                  value={formData.contact}
                  onChange={handleInputChange}
                  placeholder="Decision maker name & phone" 
                  className="mt-1 p-2 w-full border border-gray-300 rounded-lg focus:border-[#660033] focus:ring-[#660033] placeholder-gray-400 text-black" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">📍 Project Location</label>
              <input 
                type="text" 
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Site address or office location" 
                className="mt-1 p-2 w-full border border-gray-300 rounded-lg focus:border-[#660033] focus:ring-[#660033] placeholder-gray-400 text-black" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">📅 Follow-up Date</label>
              <input 
                type="date" 
                name="follow_up_date"
                value={formData.follow_up_date}
                onChange={handleInputChange}
                className="mt-1 p-2 w-full border border-gray-300 rounded-lg focus:border-[#660033] focus:ring-[#660033] text-black" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">📅 Meeting/Follow-up Schedule</label>
              <input 
                type="text" 
                name="appointments"
                value={formData.appointments}
                onChange={handleInputChange}
                placeholder="Next meeting date/time or follow-up plans" 
                className="mt-1 p-2 w-full border border-gray-300 rounded-lg focus:border-[#660033] focus:ring-[#660033] placeholder-gray-400 text-black" 
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700">👤 Marketing Representatives</label>
              <div 
                onClick={() => setShowDropdown(!showDropdown)}
                className="mt-1 p-2 w-full border border-gray-300 rounded-lg focus:border-[#660033] focus:ring-[#660033] cursor-pointer flex items-center justify-between bg-white text-black"
              >
                <span className="text-gray-700">
                  {formData.attendees.length === 0 ? 'Select representatives' : `Selected ${formData.attendees.length} representatives`}
                </span>
                <ArrowDownIcon />
              </div>
              {showDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-auto">
                  {defaultAttendees.map(name => (
                    <label key={name} className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer">
                      <span className="flex-1 text-black">{name}</span>
                      <input 
                        type="checkbox"
                        checked={formData.attendees.includes(name)}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            attendees: e.target.checked 
                              ? [...prev.attendees, name]
                              : prev.attendees.filter(a => a !== name)
                          }));
                        }}
                        className="h-4 w-4 text-[#660033] focus:ring-[#660033] border-gray-300 rounded"
                      />
                    </label>
                  ))}
                  <div className="px-4 py-2 border-t border-gray-200">
                    <input 
                      type="text" 
                      placeholder="Enter custom name and press Enter"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          const customName = e.target.value.trim();
                          if (!formData.attendees.includes(customName)) {
                            setFormData(prev => ({
                              ...prev,
                              attendees: [...prev.attendees, customName]
                            }));
                          }
                          e.target.value = '';
                          e.preventDefault();
                        }
                      }}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:border-[#660033] focus:ring-[#660033] placeholder-gray-400 text-black"
                    />
                  </div>
                </div>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.attendees.map(att => (
                  <div key={att} className="bg-[#660033]/10 text-[#660033] px-3 py-1 rounded-full flex items-center text-sm font-medium">
                    {att}
                    <button 
                      onClick={() => setFormData(prev => ({...prev, attendees: prev.attendees.filter(a => a !== att)}))}
                      className="ml-2 text-[#660033] hover:text-red-600 focus:outline-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">📝 Lead Status & Notes</label>
              <textarea 
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                placeholder="Lead quality, project details, budget discussion, next actions..." 
                className="mt-1 p-2 w-full border border-gray-300 rounded-lg h-24 focus:border-[#660033] focus:ring-[#660033] placeholder-gray-400 text-black"
              ></textarea>
            </div>
            <button 
              type="button" 
              onClick={handleSubmit} 
              disabled={submitting}
              className="bg-[#660033] text-white px-4 py-2 rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
            >
              {submitting ? '⏳ Adding Lead...' : '🎯 Add Lead Entry'}
            </button>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0">
            <h2 className="text-[#660033] font-semibold">
              📊 Marketing Lead Tracker ({entries.length})
            </h2>
            <button 
              onClick={exportToPDF}
              className="bg-[#660033] text-white px-4 py-2 rounded-lg hover:bg-opacity-90 text-sm disabled:opacity-50 w-full sm:w-auto"
              disabled={entries.length === 0}
            >
              Export to PDF
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <p>Loading entries...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-lg">
              <p>📋 No leads tracked yet. Add your first prospect above to start building your pipeline!</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <div className="min-w-full inline-block align-middle">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-[#660033] text-white">
                      <th className="border border-gray-300 px-2 md:px-4 py-3 text-left font-semibold text-sm whitespace-nowrap">🏢 Client</th>
                      <th className="border border-gray-300 px-2 md:px-4 py-3 text-left font-semibold text-sm whitespace-nowrap">📞 Contact</th>
                      <th className="border border-gray-300 px-2 md:px-4 py-3 text-left font-semibold text-sm whitespace-nowrap">📍 Location</th>
                      <th className="border border-gray-300 px-2 md:px-4 py-3 text-left font-semibold text-sm whitespace-nowrap">📅 Date</th>
                      <th className="border border-gray-300 px-2 md:px-4 py-3 text-left font-semibold text-sm whitespace-nowrap">📅 Follow-up</th>
                      <th className="border border-gray-300 px-2 md:px-4 py-3 text-left font-semibold text-sm whitespace-nowrap">👤 Reps</th>
                      <th className="border border-gray-300 px-2 md:px-4 py-3 text-left font-semibold text-sm whitespace-nowrap">📝 Status</th>
                      <th className="border border-gray-300 px-2 md:px-4 py-3 text-center font-semibold text-sm whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry, index) => (
                      <tr key={entry.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 px-2 md:px-4 py-3 font-semibold text-[#660033] min-w-[150px]">
                          <div className="break-words">{entry.company}</div>
                          <div className="text-xs text-gray-500 font-normal mt-1">
                            {new Date(entry.created_at).toLocaleDateString()} at {new Date(entry.created_at).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="border border-gray-300 px-2 md:px-4 py-3 text-gray-900 min-w-[120px]">
                          <div className="break-words">{entry.contact || '-'}</div>
                        </td>
                        <td className="border border-gray-300 px-2 md:px-4 py-3 text-gray-900 min-w-[150px]">
                          <div className="break-words">{entry.address || '-'}</div>
                        </td>
                        <td className="border border-gray-300 px-2 md:px-4 py-3 text-gray-900 min-w-[100px]">
                          <div className="break-words">{entry.follow_up_date ? new Date(entry.follow_up_date).toLocaleDateString() : '-'}</div>
                        </td>
                        <td className="border border-gray-300 px-2 md:px-4 py-3 text-gray-900 min-w-[120px]">
                          <div className="break-words">{entry.appointments || '-'}</div>
                        </td>
                        <td className="border border-gray-300 px-2 md:px-4 py-3 text-gray-900 min-w-[100px]">
                          <div className="break-words text-[#660033] font-medium">
                            {Array.isArray(entry.attendees) ? entry.attendees.join(', ') : entry.attendees || '-'}
                          </div>
                        </td>
                        <td className="border border-gray-300 px-2 md:px-4 py-3 text-gray-900 min-w-[150px]">
                          <div className="break-words">{entry.remarks || '-'}</div>
                        </td>
                        <td className="border border-gray-300 px-2 md:px-4 py-3 text-center min-w-[80px]">
                          <div className="flex justify-center space-x-1">
                            <button
                              onClick={() => handleEdit(entry)}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                              title="Edit entry"
                            >
                              <EditIcon />
                            </button>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                              title="Delete entry"
                            >
                              <DeleteIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}