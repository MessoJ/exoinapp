import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Plus, 
  Search, 
  FileText, 
  Edit2, 
  Trash2, 
  Copy, 
  Share2,
  Tag,
  Clock,
  MoreHorizontal,
  ChevronDown,
  Check,
  Filter
} from 'lucide-react';
import { mailApi } from '../../lib/api';

// Category colors
const CATEGORY_COLORS = {
  GENERAL: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  SALES: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  SUPPORT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  MARKETING: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  HR: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  FINANCE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  FOLLOW_UP: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  MEETING: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  INTRODUCTION: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  THANK_YOU: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

/**
 * TemplateCard - Single template display
 */
const TemplateCard = ({ template, onSelect, onEdit, onDelete, onDuplicate }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700
        hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-md transition-all"
    >
      {/* Main content - clickable */}
      <button
        onClick={() => onSelect(template)}
        className="w-full p-4 text-left"
      >
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-gray-900 dark:text-white line-clamp-1">
            {template.name}
          </h4>
          {template.isShared && (
            <Share2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
          )}
        </div>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mb-3">
          {template.subject || '(no subject)'}
        </p>

        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[template.category]}`}>
            {template.category.replace(/_/g, ' ')}
          </span>
          {template.usageCount > 0 && (
            <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Used {template.usageCount}x
            </span>
          )}
        </div>
      </button>

      {/* Menu button */}
      <div className="absolute top-3 right-3">
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100
              hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
          >
            <MoreHorizontal className="w-4 h-4 text-gray-400" />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 
                  rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10"
              >
                {template.isOwner && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onEdit(template);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm 
                      hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                  >
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onDuplicate(template);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm 
                    hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                >
                  <Copy className="w-4 h-4" /> Duplicate
                </button>
                {template.isOwner && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onDelete(template);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600
                      hover:bg-red-50 dark:hover:bg-red-900/20 text-left"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * TemplateEditor - Create/edit template modal
 */
const TemplateEditor = ({ template, categories, onSave, onClose }) => {
  const [name, setName] = useState(template?.name || '');
  const [subject, setSubject] = useState(template?.subject || '');
  const [textBody, setTextBody] = useState(template?.textBody || '');
  const [category, setCategory] = useState(template?.category || 'GENERAL');
  const [isShared, setIsShared] = useState(template?.isShared || false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      await onSave({
        id: template?.id,
        name: name.trim(),
        subject,
        textBody,
        category,
        isShared,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save template:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {template ? 'Edit Template' : 'Create Template'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Template Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Follow-up after meeting"
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                  focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                  focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subject Line
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Following up on {{topic}}"
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                  focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use {"{{placeholders}}"} for dynamic content
              </p>
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Body
              </label>
              <textarea
                value={textBody}
                onChange={(e) => setTextBody(e.target.value)}
                placeholder="Hi {{name}},&#10;&#10;Thank you for meeting with me today..."
                rows={8}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                  focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
            </div>

            {/* Shared */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isShared}
                onChange={(e) => setIsShared(e.target.checked)}
                className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Share with team
              </span>
            </label>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300
                hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium
                bg-orange-500 text-white rounded-lg hover:bg-orange-600
                transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : template ? 'Save Changes' : 'Create Template'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

/**
 * TemplatesPanel - Full templates management UI
 */
const TemplatesPanel = ({ onSelectTemplate, onClose }) => {
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  // Fetch templates and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [templatesRes, categoriesRes] = await Promise.all([
          mailApi.getTemplates({ category: selectedCategory, search }),
          mailApi.getTemplateCategories(),
        ]);
        setTemplates(templatesRes.data.templates || []);
        setCategories(categoriesRes.data.categories || []);
      } catch (err) {
        console.error('Failed to fetch templates:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory, search]);

  // Handle template selection
  const handleSelect = async (template) => {
    try {
      const res = await mailApi.useTemplate(template.id, {});
      onSelectTemplate({
        subject: res.data.subject,
        body: res.data.textBody || res.data.htmlBody,
      });
      onClose();
    } catch (err) {
      console.error('Failed to use template:', err);
    }
  };

  // Handle template save
  const handleSave = async (data) => {
    if (data.id) {
      await mailApi.updateTemplate(data.id, data);
    } else {
      await mailApi.createTemplate(data);
    }
    // Refresh list
    const res = await mailApi.getTemplates({ category: selectedCategory, search });
    setTemplates(res.data.templates || []);
  };

  // Handle delete
  const handleDelete = async (template) => {
    if (!confirm(`Delete template "${template.name}"?`)) return;
    await mailApi.deleteTemplate(template.id);
    setTemplates(templates.filter(t => t.id !== template.id));
  };

  // Handle duplicate
  const handleDuplicate = async (template) => {
    const res = await mailApi.duplicateTemplate(template.id);
    setTemplates([res.data.template, ...templates]);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Email Templates
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingTemplate(null);
                setEditorOpen(true);
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium
                bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Plus className="w-4 h-4" /> New
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 px-6 py-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm
                focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm
              focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent" />
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <FileText className="w-12 h-12 mb-4 text-gray-300" />
              <p className="font-medium">No templates found</p>
              <p className="text-sm mt-1">Create your first template to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={handleSelect}
                  onEdit={(t) => {
                    setEditingTemplate(t);
                    setEditorOpen(true);
                  }}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Editor Modal */}
      <AnimatePresence>
        {editorOpen && (
          <TemplateEditor
            template={editingTemplate}
            categories={categories}
            onSave={handleSave}
            onClose={() => {
              setEditorOpen(false);
              setEditingTemplate(null);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TemplatesPanel;
