import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaChartLine, FaUsers, FaDollarSign, FaBullseye } from 'react-icons/fa';
import { dashboardsAPI } from '../../services/api';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const [dashboards, setDashboards] = useState([]);
  const [currentDashboard, setCurrentDashboard] = useState(null);
  const [kpiData, setKpiData] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isDefault: false
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDashboards();
  }, []);

  useEffect(() => {
    if (currentDashboard) {
      loadKPIData();
    }
  }, [currentDashboard]);

  const loadDashboards = async () => {
    try {
      setLoading(true);
      const response = await dashboardsAPI.getAll();
      setDashboards(response.data.dashboards || []);

      // Load default dashboard or first dashboard
      const defaultDash = response.data.dashboards.find(d => d.isDefault);
      if (defaultDash) {
        setCurrentDashboard(defaultDash);
      } else if (response.data.dashboards.length > 0) {
        setCurrentDashboard(response.data.dashboards[0]);
      }
    } catch (error) {
      toast.error('Failed to load dashboards');
    } finally {
      setLoading(false);
    }
  };

  const loadKPIData = async () => {
    if (!currentDashboard) return;

    try {
      const response = await dashboardsAPI.getKPIs(currentDashboard._id);
      setKpiData(response.data.kpis || {});
    } catch (error) {
      console.error('Failed to load KPI data:', error);
    }
  };

  const handleCreateDashboard = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Create dashboard with default KPI widgets
      const dashboardData = {
        ...formData,
        widgets: [
          {
            id: 'total-clients',
            type: 'kpi',
            title: 'Total Clients',
            config: { metric: 'total_clients' },
            position: { x: 0, y: 0, w: 3, h: 2 },
            isActive: true
          },
          {
            id: 'active-deals',
            type: 'kpi',
            title: 'Active Deals',
            config: { metric: 'active_deals' },
            position: { x: 3, y: 0, w: 3, h: 2 },
            isActive: true
          },
          {
            id: 'monthly-sales',
            type: 'kpi',
            title: 'Monthly Sales',
            config: { metric: 'monthly_sales', period: 'monthly' },
            position: { x: 6, y: 0, w: 3, h: 2 },
            isActive: true
          },
          {
            id: 'conversion-rate',
            type: 'kpi',
            title: 'Conversion Rate',
            config: { metric: 'conversion_rate' },
            position: { x: 9, y: 0, w: 3, h: 2 },
            isActive: true
          }
        ]
      };

      await dashboardsAPI.create(dashboardData);
      toast.success('Dashboard created successfully');
      setShowCreateModal(false);
      setFormData({ name: '', description: '', isDefault: false });
      loadDashboards();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create dashboard');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateDashboard = async (e) => {
    e.preventDefault();
    if (!currentDashboard) return;

    setSaving(true);
    try {
      await dashboardsAPI.update(currentDashboard._id, formData);
      toast.success('Dashboard updated successfully');
      setShowEditModal(false);
      loadDashboards();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update dashboard');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDashboard = async (dashboard) => {
    if (!window.confirm(`Delete dashboard "${dashboard.name}"?`)) return;

    try {
      await dashboardsAPI.delete(dashboard._id);
      toast.success('Dashboard deleted successfully');
      loadDashboards();
    } catch (error) {
      toast.error('Failed to delete dashboard');
    }
  };

  const renderKPIWidget = (widget) => {
    const data = kpiData[widget.id];

    if (!data) {
      return (
        <Card className="h-100">
          <Card.Body className="d-flex align-items-center justify-content-center">
            <Spinner animation="border" />
          </Card.Body>
        </Card>
      );
    }

    const formatValue = (value, format) => {
      switch (format) {
        case 'currency':
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(value);
        case 'percentage':
          return `${value}%`;
        default:
          return value.toLocaleString();
      }
    };

    const getIcon = (metric) => {
      switch (metric) {
        case 'total_clients':
        case 'monthly_clients':
          return <FaUsers className="text-primary" size={24} />;
        case 'monthly_sales':
        case 'total_sales':
          return <FaDollarSign className="text-success" size={24} />;
        case 'conversion_rate':
          return <FaBullseye className="text-warning" size={24} />;
        default:
          return <FaChartLine className="text-info" size={24} />;
      }
    };

    return (
      <Card className="h-100 shadow-sm">
        <Card.Body className="d-flex align-items-center">
          <div className="me-3">
            {getIcon(widget.config?.metric)}
          </div>
          <div className="flex-grow-1">
            <h4 className="mb-1">{formatValue(data.value, data.format)}</h4>
            <small className="text-muted">{data.label}</small>
          </div>
        </Card.Body>
      </Card>
    );
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <Spinner animation="border" />
          <p className="mt-2">Loading dashboards...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">Dashboard</h2>
              <p className="text-muted mb-0">Monitor your business performance with custom KPIs</p>
            </div>
            <div className="d-flex gap-2">
              <Button
                variant="outline-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <FaPlus className="me-2" />
                New Dashboard
              </Button>
              {currentDashboard && (
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    setFormData({
                      name: currentDashboard.name,
                      description: currentDashboard.description || '',
                      isDefault: currentDashboard.isDefault
                    });
                    setShowEditModal(true);
                  }}
                >
                  <FaEdit className="me-2" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </Col>
      </Row>

      {/* Dashboard Selector */}
      {dashboards.length > 1 && (
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Body>
                <div className="d-flex gap-2 flex-wrap">
                  {dashboards.map(dashboard => (
                    <Button
                      key={dashboard._id}
                      variant={currentDashboard?._id === dashboard._id ? 'primary' : 'outline-primary'}
                      size="sm"
                      onClick={() => setCurrentDashboard(dashboard)}
                    >
                      {dashboard.name}
                      {dashboard.isDefault && ' (Default)'}
                    </Button>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Dashboard Widgets */}
      {currentDashboard ? (
        <Row>
          {currentDashboard.widgets
            .filter(widget => widget.isActive)
            .map(widget => (
              <Col key={widget.id} lg={3} md={6} className="mb-4">
                {renderKPIWidget(widget)}
              </Col>
            ))}
        </Row>
      ) : (
        <Row>
          <Col>
            <Card className="text-center py-5">
              <Card.Body>
                <FaChartLine size={48} className="text-muted mb-3" />
                <h4>No Dashboards Found</h4>
                <p className="text-muted">Create your first dashboard to start monitoring your business metrics.</p>
                <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                  <FaPlus className="me-2" />
                  Create Dashboard
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Create Dashboard Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Dashboard</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateDashboard}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Dashboard Name</Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </Form.Group>
            <Form.Check
              type="checkbox"
              label="Set as default dashboard"
              checked={formData.isDefault}
              onChange={(e) => setFormData({...formData, isDefault: e.target.checked})}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? <Spinner animation="border" size="sm" /> : null}
              Create Dashboard
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Dashboard Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Dashboard</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateDashboard}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Dashboard Name</Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </Form.Group>
            <Form.Check
              type="checkbox"
              label="Set as default dashboard"
              checked={formData.isDefault}
              onChange={(e) => setFormData({...formData, isDefault: e.target.checked})}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" variant="outline-danger" className="me-auto" onClick={() => handleDeleteDashboard(currentDashboard)}>
              <FaTrash className="me-2" />
              Delete
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? <Spinner animation="border" size="sm" /> : null}
              Update Dashboard
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default Dashboard;