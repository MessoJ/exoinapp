import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileEdit, Receipt, FileSpreadsheet, CreditCard, Mail, Palette, 
  Building2, Laptop, Gift, BookOpen, LayoutGrid, ArrowRight,
  Search, Filter, ChevronRight, Eye, Edit3, Plus
} from 'lucide-react';

// Template category data
const TEMPLATE_CATEGORIES = [
  {
    id: 'documents',
    title: 'Documents',
    description: 'Official business documents and correspondence',
    icon: FileEdit,
    color: 'orange',
    templates: [
      {
        id: 'letterhead',
        title: 'Letterhead',
        description: 'Professional branded letterhead for official correspondence, contracts, and formal letters',
        preview: '/templates/letterhead-preview.png',
        editorPath: '/editor/letterhead',
        previewPath: '/templates/letterheads',
        features: ['Branded header', 'Editable body', 'Professional footer', 'Print-ready'],
      },
      {
        id: 'invoice',
        title: 'Invoice',
        description: 'Professional invoice template with line items, tax calculation, and payment details',
        preview: '/templates/invoice-preview.png',
        editorPath: '/editor/invoice',
        previewPath: '/templates/invoices',
        features: ['Auto-calculate totals', 'Tax support', 'Payment terms', 'Client info'],
      },
      {
        id: 'quotation',
        title: 'Quotation',
        description: 'Sales proposals and quotations with scope of work and pricing breakdown',
        preview: '/templates/quotation-preview.png',
        editorPath: '/editor/quotation',
        previewPath: '/templates/quotations',
        features: ['Scope section', 'Line items', 'Validity period', 'Terms & conditions'],
      },
    ],
  },
  {
    id: 'brand-assets',
    title: 'Brand Assets',
    description: 'Visual identity and marketing materials',
    icon: Palette,
    color: 'blue',
    templates: [
      {
        id: 'business-card',
        title: 'Business Card',
        description: 'Professional business card design with front and back layouts',
        preview: '/templates/business-card-preview.png',
        editorPath: '/editor/business-card',
        previewPath: '/assets/business-cards',
        features: ['Front & back design', 'QR code', 'Contact info', 'Premium finish'],
        viewOnly: true,
      },
      {
        id: 'email-signature',
        title: 'Email Signature',
        description: 'Professional email signature with social links and branding',
        preview: '/templates/email-signature-preview.png',
        editorPath: '/signature',
        previewPath: '/assets/email-signatures',
        features: ['Social links', 'Photo support', 'HTML compatible', 'Multiple styles'],
      },
      {
        id: 'stationery',
        title: 'Stationery Set',
        description: 'Complete stationery set including envelopes, folders, and notepads',
        preview: '/templates/stationery-preview.png',
        previewPath: '/assets/stationery',
        features: ['Envelope designs', 'Folder templates', 'Notepad layouts', 'Brand consistency'],
        viewOnly: true,
      },
    ],
  },
  {
    id: 'digital',
    title: 'Digital',
    description: 'Digital presence and online materials',
    icon: Laptop,
    color: 'purple',
    templates: [
      {
        id: 'social-media',
        title: 'Social Media Kit',
        description: 'Social media post templates, cover photos, and profile images',
        preview: '/templates/social-preview.png',
        previewPath: '/assets/digital',
        features: ['Profile images', 'Cover photos', 'Post templates', 'Story formats'],
        viewOnly: true,
      },
      {
        id: 'presentation',
        title: 'Presentation',
        description: 'PowerPoint/Keynote presentation templates with brand styling',
        preview: '/templates/presentation-preview.png',
        previewPath: '/assets/digital',
        features: ['Slide layouts', 'Chart styles', 'Icon set', 'Animation ready'],
        viewOnly: true,
      },
    ],
  },
  {
    id: 'environmental',
    title: 'Environmental',
    description: 'Physical space and merchandise branding',
    icon: Building2,
    color: 'green',
    templates: [
      {
        id: 'signage',
        title: 'Signage',
        description: 'Interior and exterior signage designs for offices and facilities',
        preview: '/templates/signage-preview.png',
        previewPath: '/brand/interiors',
        features: ['Wayfinding', 'Door signs', 'Reception', 'Outdoor'],
        viewOnly: true,
      },
      {
        id: 'merchandise',
        title: 'Merchandise',
        description: 'Branded merchandise including apparel, mugs, and accessories',
        preview: '/templates/merch-preview.png',
        previewPath: '/assets/accessories',
        features: ['T-shirts', 'Mugs', 'Bags', 'Notebooks'],
        viewOnly: true,
      },
    ],
  },
  {
    id: 'guidelines',
    title: 'Brand Guidelines',
    description: 'Brand standards and usage documentation',
    icon: BookOpen,
    color: 'slate',
    templates: [
      {
        id: 'brand-book',
        title: 'Brand Guidelines',
        description: 'Complete brand guidelines document with logo usage, colors, and typography',
        preview: '/templates/brandbook-preview.png',
        previewPath: '/brand/guidelines',
        features: ['Logo rules', 'Color palette', 'Typography', 'Do\'s & Don\'ts'],
        viewOnly: true,
      },
      {
        id: 'logo-showcase',
        title: 'Logo Showcase',
        description: 'Logo variations, clear space rules, and downloadable assets',
        preview: '/templates/logo-preview.png',
        previewPath: '/brand/logos',
        features: ['All variations', 'Clear space', 'Minimum size', 'Downloads'],
        viewOnly: true,
      },
    ],
  },
];

// Color utilities
const getColorClasses = (color) => {
  const colors = {
    orange: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200', hover: 'hover:bg-orange-50' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200', hover: 'hover:bg-blue-50' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200', hover: 'hover:bg-purple-50' },
    green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200', hover: 'hover:bg-green-50' },
    slate: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', hover: 'hover:bg-slate-50' },
  };
  return colors[color] || colors.slate;
};

// Template Card Component
const TemplateCard = ({ template, color }) => {
  const colorClasses = getColorClasses(color);
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 group">
      {/* Preview Image Placeholder */}
      <div className={`h-40 ${colorClasses.bg} flex items-center justify-center relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent" />
        <div className={`w-24 h-32 bg-white rounded shadow-lg flex items-center justify-center ${colorClasses.border} border-2`}>
          <FileEdit className={colorClasses.text} size={32} />
        </div>
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          {template.previewPath && (
            <Link 
              to={template.previewPath}
              className="px-3 py-2 bg-white/90 rounded-lg text-sm font-medium text-slate-700 hover:bg-white flex items-center gap-2"
            >
              <Eye size={16} /> Preview
            </Link>
          )}
          {template.editorPath && !template.viewOnly && (
            <Link 
              to={template.editorPath}
              className="px-3 py-2 bg-orange-500 rounded-lg text-sm font-medium text-white hover:bg-orange-600 flex items-center gap-2"
            >
              <Edit3 size={16} /> Create
            </Link>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-slate-900">{template.title}</h3>
          {template.viewOnly && (
            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full">View Only</span>
          )}
        </div>
        <p className="text-sm text-slate-500 mb-3 line-clamp-2">{template.description}</p>
        
        {/* Features */}
        <div className="flex flex-wrap gap-1">
          {template.features?.slice(0, 3).map((feature, i) => (
            <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
              {feature}
            </span>
          ))}
          {template.features?.length > 3 && (
            <span className="px-2 py-0.5 bg-slate-100 text-slate-400 text-xs rounded">
              +{template.features.length - 3}
            </span>
          )}
        </div>
      </div>
      
      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
        {template.editorPath && !template.viewOnly ? (
          <Link 
            to={template.editorPath}
            className={`text-sm font-medium ${colorClasses.text} hover:underline flex items-center gap-1`}
          >
            Create New <ArrowRight size={14} />
          </Link>
        ) : template.previewPath ? (
          <Link 
            to={template.previewPath}
            className="text-sm font-medium text-slate-600 hover:underline flex items-center gap-1"
          >
            View Template <ArrowRight size={14} />
          </Link>
        ) : (
          <span className="text-sm text-slate-400">Coming soon</span>
        )}
      </div>
    </div>
  );
};

// Category Section Component
const CategorySection = ({ category }) => {
  const colorClasses = getColorClasses(category.color);
  const Icon = category.icon;
  
  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-lg ${colorClasses.bg} flex items-center justify-center`}>
          <Icon className={colorClasses.text} size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">{category.title}</h2>
          <p className="text-sm text-slate-500">{category.description}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {category.templates.map(template => (
          <TemplateCard key={template.id} template={template} color={category.color} />
        ))}
      </div>
    </div>
  );
};

// Main Templates Gallery Page
const TemplatesGalleryPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Filter templates based on search and category
  const filteredCategories = TEMPLATE_CATEGORIES.filter(category => {
    if (selectedCategory !== 'all' && category.id !== selectedCategory) return false;
    return true;
  }).map(category => ({
    ...category,
    templates: category.templates.filter(template =>
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.templates.length > 0);

  // Quick action templates (most used)
  const quickActions = [
    { title: 'Letterhead', icon: FileEdit, path: '/editor/letterhead', color: 'orange' },
    { title: 'Invoice', icon: Receipt, path: '/editor/invoice', color: 'orange' },
    { title: 'Quotation', icon: FileSpreadsheet, path: '/editor/quotation', color: 'blue' },
    { title: 'Email Signature', icon: Mail, path: '/signature', color: 'purple' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Templates</h1>
          <p className="text-slate-500">Create professional documents using branded templates</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Plus size={18} className="text-orange-400" /> Quick Create
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map(action => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                to={action.path}
                className="flex items-center gap-3 p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors group"
              >
                <div className={`w-10 h-10 rounded-lg bg-${action.color}-500 flex items-center justify-center`}>
                  <Icon className="text-white" size={20} />
                </div>
                <div>
                  <p className="font-medium text-white">{action.title}</p>
                  <p className="text-xs text-slate-400">Create new</p>
                </div>
                <ChevronRight className="text-slate-500 group-hover:text-white ml-auto transition-colors" size={18} />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Categories</option>
              {TEMPLATE_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.title}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Template Categories */}
      <div>
        {filteredCategories.length > 0 ? (
          filteredCategories.map(category => (
            <CategorySection key={category.id} category={category} />
          ))
        ) : (
          <div className="text-center py-12">
            <LayoutGrid size={48} className="text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No templates found</h3>
            <p className="text-slate-500">Try adjusting your search or filter</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplatesGalleryPage;
