import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Ruler, Plus, Trash2, Check, AlertCircle } from 'lucide-react';

const MeasurementUnitsSettings = () => {
  const { data, addMeasurementUnit, removeMeasurementUnit } = useData();
  const measurementUnits = data.settings?.measurementUnits || ['sq.ft', 'kg', 'piece', 'meter', 'ft'];

  const [newUnit, setNewUnit] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleAddUnit = async () => {
    if (!newUnit.trim()) {
      setError('Please enter a measurement unit');
      return;
    }

    const success = await addMeasurementUnit(newUnit.trim());
    
    if (success) {
      setNewUnit('');
      setSaveSuccess(true);
      setError('');
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setError('This measurement unit already exists');
    }
  };

  const handleRemoveUnit = async (unit) => {
    // Prevent removing default units
    const defaultUnits = ['sq.ft', 'kg', 'piece', 'meter', 'ft'];
    if (defaultUnits.includes(unit)) {
      setError('Cannot remove default measurement units');
      setTimeout(() => setError(''), 3000);
      return;
    }

    await removeMeasurementUnit(unit);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-3 rounded-lg shadow-sm">
          <Ruler className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Measurement Units</h2>
          <p className="text-gray-600 text-sm">Manage custom measurement units for invoices</p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {saveSuccess && (
        <div className="mb-4 p-3 bg-success-50 border border-success-200 rounded-lg flex items-center gap-2">
          <Check className="w-5 h-5 text-success-600" />
          <p className="text-success-700 text-sm">Measurement units updated successfully!</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-danger-600" />
          <p className="text-danger-700 text-sm">{error}</p>
        </div>
      )}

      {/* Add New Unit */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-6">
        <h4 className="font-semibold text-gray-900 mb-4">Add Custom Measurement Unit</h4>
        <div className="flex gap-3">
          <input
            type="text"
            value={newUnit}
            onChange={(e) => setNewUnit(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddUnit()}
            className="input flex-1"
            placeholder="e.g., liter, ton, box"
            maxLength="20"
          />
          <button
            onClick={handleAddUnit}
            className="btn btn-primary flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add Unit
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Add custom measurement units that will appear in the dropdown when creating invoices
        </p>
      </div>

      {/* Current Units */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-4">Current Measurement Units</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {measurementUnits.map((unit, index) => {
            const isDefault = ['sq.ft', 'kg', 'piece', 'meter', 'ft'].includes(unit);
            return (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  isDefault
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-white border-gray-200'
                }`}
              >
                <span className="text-sm font-medium text-gray-900">{unit}</span>
                {!isDefault && (
                  <button
                    onClick={() => handleRemoveUnit(unit)}
                    className="p-1 text-danger-600 hover:bg-danger-50 rounded transition-colors"
                    title="Remove unit"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                {isDefault && (
                  <span className="text-xs text-blue-600 font-medium">Default</span>
                )}
              </div>
            );
          })}
        </div>
        {measurementUnits.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4">
            No measurement units available. Add your first unit above.
          </p>
        )}
      </div>

      {/* Information */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Default measurement units (sq.ft, kg, piece, meter, ft) cannot be removed. 
          Custom units can be added and removed as needed.
        </p>
      </div>
    </div>
  );
};

export default MeasurementUnitsSettings;

