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
  const [formData, setFormData] = useState({
    company: '',
    contact: '',
    address: '',
    appointments: '',
    remarks: ''
  });

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

      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
      alert('Error loading entries. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Field ${name} changed to:`, value); // Debug log
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    // Check if required fields are filled
    if (!formData.company.trim()) {
      alert('Please enter a company name');
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
            appointments: formData.appointments,
            remarks: formData.remarks
          }
        ])
        .select();

      if (error) throw error;

      console.log('New entry added:', data[0]);
      
      // Add the new entry to the local state
      setEntries(prev => [data[0], ...prev]);
      
      // Reset form
      setFormData({
        company: '',
        contact: '',
        address: '',
        appointments: '',
        remarks: ''
      });

      alert('Entry added successfully!');
    } catch (error) {
      console.error('Error adding entry:', error);
      alert('Error adding entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (entry) => {
    // Populate form with entry data for editing
    setFormData({
      company: entry.company,
      contact: entry.contact || '',
      address: entry.address || '',
      appointments: entry.appointments || '',
      remarks: entry.remarks || ''
    });
    
    // Remove the entry being edited from local state
    setEntries(prev => prev.filter(e => e.id !== entry.id));
    
    // Delete the entry from database (it will be re-added when form is submitted)
    try {
      const { error } = await supabase
        .from('work_entries')
        .delete()
        .eq('id', entry.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting entry for edit:', error);
      alert('Error preparing entry for editing.');
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

        // Remove from local state
        setEntries(prev => prev.filter(entry => entry.id !== id));
        alert('Entry deleted successfully!');
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
      
      // Set up the document
      const pageWidth = doc.internal.pageSize.width;
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(102, 0, 51); // #660033
      doc.text('📋 Ideals Contracting', 20, 25);
      
      doc.setFontSize(14);
      doc.setTextColor(100, 100, 100);
      doc.text('Marketing Department Work Tracker Report', 20, 35);
      
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, 45);
      
      // Add a line separator
      doc.setDrawColor(102, 0, 51);
      doc.line(20, 50, pageWidth - 20, 50);
      
      // Prepare table data - ensure all fields are strings
      const tableData = entries.map(entry => [
        entry.company || '',
        entry.contact || '',
        entry.address || '',
        entry.appointments || '',
        entry.remarks || ''
      ]);
      
      // Create the table
      autoTable(doc, {
        startY: 60,
        head: [['Company', 'Contact', 'Address', 'Appointments', 'Remarks']],
        body: tableData,
        theme: 'striped',
        styles: {
          fontSize: 9,
          cellPadding: 4,
          valign: 'top',
          overflow: 'linebreak',
          minCellHeight: 15
        },
        headStyles: {
          fillColor: [102, 0, 51], // #660033
          textColor: 255,
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'center'
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        columnStyles: {
          0: { cellWidth: 35, fontStyle: 'bold' }, // Company
          1: { cellWidth: 30 }, // Contact
          2: { cellWidth: 40 }, // Address
          3: { cellWidth: 35 }, // Appointments
          4: { cellWidth: 45 } // Remarks
        },
        margin: { left: 15, right: 15 },
        didDrawPage: function (data) {
          // Footer
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(
            `Total Entries: ${entries.length} | Page ${doc.internal.getNumberOfPages()}`,
            15,
            doc.internal.pageSize.height - 10
          );
        }
      });
      
      // Save the PDF
      const fileName = `Ideals_Contracting_Work_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  // Icon components using SVG
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

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#660033] to-[#440022] shadow-lg">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-full p-3 shadow-lg border border-white/20">
                <Image 
                  src={logo}
                  alt="Ideals Contracting Logo" 
                  width={32}
                  height={32}
                  className="object-contain rounded-full"
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-wide">
                  Ideals Contracting
                </h1>
                <p className="text-white/80 text-sm font-medium mt-1 tracking-wide">
                  Marketing Department Work Tracker
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 md:space-x-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-2 py-1 md:px-4 md:py-2">
                <div className="text-white/60 text-xs uppercase tracking-widest font-semibold">
                  Today
                </div>
                <div className="text-white text-xs md:text-sm font-medium">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-2 py-1 md:px-4 md:py-2">
                <div className="text-white/60 text-xs uppercase tracking-widest font-semibold">
                  Entries
                </div>
                <div className="text-white text-xs md:text-sm font-medium">
                  {entries.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-[#660033] font-semibold mb-4">+ Add New Work Entry</h2>
          <div className="space-y-4">
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Company *</label>
                <input 
                  type="text" 
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  placeholder="Enter company name" 
                  className="mt-1 p-2 w-full border border-gray-300 rounded-lg focus:border-[#660033] focus:ring-[#660033] placeholder-gray-400 text-black" 
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Contact</label>
                <input 
                  type="text" 
                  name="contact"
                  value={formData.contact}
                  onChange={handleInputChange}
                  placeholder="Contact person/phone" 
                  className="mt-1 p-2 w-full border border-gray-300 rounded-lg focus:border-[#660033] focus:ring-[#660033] placeholder-gray-400 text-black" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <input 
                type="text" 
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Company address" 
                className="mt-1 p-2 w-full border border-gray-300 rounded-lg focus:border-[#660033] focus:ring-[#660033] placeholder-gray-400 text-black" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Appointments</label>
              <input 
                type="text" 
                name="appointments"
                value={formData.appointments}
                onChange={handleInputChange}
                placeholder="Meeting details, scheduled appointments" 
                className="mt-1 p-2 w-full border border-gray-300 rounded-lg focus:border-[#660033] focus:ring-[#660033] placeholder-gray-400 text-black" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Remarks</label>
              <textarea 
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                placeholder="Additional notes and remarks" 
                className="mt-1 p-2 w-full border border-gray-300 rounded-lg h-24 focus:border-[#660033] focus:ring-[#660033] placeholder-gray-400 text-black"
              ></textarea>
            </div>
            <button 
              type="button" 
              onClick={handleSubmit} 
              disabled={submitting}
              className="bg-[#660033] text-white px-4 py-2 rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Adding...' : '+ Add Entry'}
            </button>
          </div>
        </div>

        {/* Work Entries Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[#660033] font-semibold">
              Daily Work Entries ({entries.length})
            </h2>
            <button 
              onClick={exportToPDF}
              className="bg-[#660033] text-white px-4 py-2 rounded-lg hover:bg-opacity-90 text-sm disabled:opacity-50"
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
              <p>No work entries yet. Add your first entry above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-[#660033] text-white">
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Company</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Contact</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Address</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Appointments</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Remarks</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, index) => (
                    <tr key={entry.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-300 px-4 py-3 font-semibold text-[#660033]">
                        {entry.company}
                        <div className="text-xs text-gray-500 font-normal">
                          {new Date(entry.created_at).toLocaleDateString()} at {new Date(entry.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-gray-900">
                        {entry.contact || '-'}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-gray-900">
                        {entry.address || '-'}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-gray-900">
                        {entry.appointments || '-'}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-gray-900">
                        {entry.remarks || '-'}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        <div className="flex justify-center space-x-2">
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
          )}
        </div>
      </main>
    </div>
  );
}