import React, { useState, useMemo } from 'react';
import { Plus, Briefcase, Euro, Clock, CheckCircle } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { ProjectTable } from './ProjectTable';
import ProjectForm from './ProjectForm';
import type { Project } from '../types/project';

interface ProjectOverviewProps {
  onProjectClick?: (projectId: string) => void;
}

const ProjectOverview: React.FC<ProjectOverviewProps> = ({ onProjectClick }) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { data: projects = [], isLoading } = useProjects();

  const stats = useMemo(() => {
    const activeProjects = projects.filter(p => p.status === 'in_progress').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const totalValue = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const invoicedValue = projects.reduce((sum, p) => sum + (p.invoicedValue || 0), 0);

    return {
      total: projects.length,
      active: activeProjects,
      completed: completedProjects,
      totalValue,
      invoicedValue,
      remainingValue: totalValue - invoicedValue,
    };
  }, [projects]);

  const handleViewDetails = (project: Project) => {
    if (onProjectClick) {
      onProjectClick(project.id);
    }
  };

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setShowForm(true);
  };

  const handleDelete = async (project: Project) => {
    if (window.confirm(`Möchten Sie das Projekt "${project.title}" wirklich löschen?`)) {
      // TODO: Implement delete functionality using useDeleteProject hook
      console.log('Delete project:', project);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedProject(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aktive Projekte</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.active}</p>
              <p className="text-xs text-gray-500 mt-1">In Bearbeitung</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Abgeschlossen</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</p>
              <p className="text-xs text-gray-500 mt-1">Erfolgreich beendet</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gesamtwert</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(stats.totalValue)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Alle Projekte</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Euro className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Offener Betrag</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(stats.remainingValue)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Noch zu fakturieren</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Briefcase className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Projektübersicht</h2>
              <p className="text-sm text-gray-600 mt-1">
                Verwalten Sie Ihre Projekte und behalten Sie den Fortschritt im Blick
              </p>
            </div>
            <button 
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Neues Projekt
            </button>
          </div>
        </div>

        <div className="p-6">
          <ProjectTable
            projects={projects}
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>

      {showForm && (
        <ProjectForm 
          project={selectedProject} 
          onSuccess={handleCloseForm} 
        />
      )}
    </div>
  );
};

export default ProjectOverview;