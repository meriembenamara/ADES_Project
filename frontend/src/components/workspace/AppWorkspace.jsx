import { useEffect, useMemo, useState } from "react";
import { initialClassrooms } from "../../data/mockWorkspace";
import {
  createControlPoint,
  createDocument,
  deleteControlPoint,
  deleteDocument,
  deleteUser,
  fetchControlPoints,
  fetchDashboards,
  fetchDocuments,
  fetchUsers,
} from "../../services/workspaceApi";
import ClassManagementSection from "./ClassManagementSection";
import ControlPointsSection from "./ControlPointsSection";
import DashboardSection from "./DashboardSection";
import DocumentsManagementSection from "./DocumentsManagementSection";
import LabelingWorkspace from "./LabelingWorkspace";
import UsersManagementSection from "./UsersManagementSection";
import WorkspaceNavbar from "./WorkspaceNavbar";

function AppWorkspace({ user, token, onSignOut, submitting }) {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [classrooms, setClassrooms] = useState(initialClassrooms);
  const [dashboards, setDashboards] = useState([]);
  const [users, setUsers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [controlPoints, setControlPoints] = useState([]);
  const [loadingRemote, setLoadingRemote] = useState(true);
  const [workspaceMessage, setWorkspaceMessage] = useState("");
  const [labelingCategoryId, setLabelingCategoryId] = useState(null);
  const [draftAttribute, setDraftAttribute] = useState("");
  const [draftAttributeSnippet, setDraftAttributeSnippet] = useState("");
  const [draftValue, setDraftValue] = useState("");
  const [controlForm, setControlForm] = useState({
    name: "",
    description: "",
    status: "todo",
    dueDate: "",
    documentId: "",
    assignedTo: "",
  });
  const [documentForm, setDocumentForm] = useState({
    title: "",
    description: "",
    status: "draft",
    createdBy: "",
  });

  const selectedCategory = useMemo(
    () =>
      classrooms
        .flatMap((classroom) => classroom.categories)
        .find((category) => category.id === labelingCategoryId) ?? null,
    [classrooms, labelingCategoryId],
  );

  const pushMessage = (message) => {
    setWorkspaceMessage(message);
  };

  useEffect(() => {
    if (!token) {
      return;
    }

    setLoadingRemote(true);
    Promise.all([
      fetchDashboards(token),
      fetchUsers(token),
      fetchDocuments(token),
      fetchControlPoints(token),
    ])
      .then(([dashboardsData, usersData, documentsData, controlPointsData]) => {
        setDashboards(Array.isArray(dashboardsData) ? dashboardsData : []);
        setUsers(Array.isArray(usersData) ? usersData : []);
        setDocuments(Array.isArray(documentsData) ? documentsData : []);
        setControlPoints(Array.isArray(controlPointsData) ? controlPointsData : []);
      })
      .catch((err) => {
        pushMessage(`Erreur API: ${err.message}`);
      })
      .finally(() => setLoadingRemote(false));
  }, [token]);

  const handleAddClass = () => {
    const nextIndex = classrooms.length + 1;

    setClassrooms((prev) => [
      ...prev,
      {
        id: `cls-${nextIndex}`,
        name: `Nouvelle classe ${nextIndex}`,
        code: `NCL-0${nextIndex}`,
        description: "Classe ajoutee depuis l'interface de gestion.",
        categories: [],
      },
    ]);
    pushMessage("Une nouvelle classe a ete ajoutee a la liste.");
  };

  const handleAddCategory = () => {
    setClassrooms((prev) =>
      prev.map((classroom, index) =>
        index === 0
          ? {
              ...classroom,
              categories: [
                ...classroom.categories,
                {
                  id: `cat-new-${classroom.categories.length + 1}`,
                  name: `Nouvelle categorie ${classroom.categories.length + 1}`,
                  children: ["Sous-categorie 1", "Sous-categorie 2"],
                  documents: 0,
                  reviewerNotes: 0,
                  historyCount: 0,
                  lastUpload: "En attente",
                  status: "Nouveau",
                  documentTitle: "Document a classifier",
                  documentSnippets: ["Aucun document importe pour le moment"],
                  attributeOptions: ["Reference", "Date", "Type document"],
                  labeledFields: [],
                },
              ],
            }
          : classroom,
      ),
    );
    pushMessage("Une nouvelle categorie a ete ajoutee dans la premiere classe.");
  };

  const handleCategoryAction = (action, category) => {
    pushMessage(`${action} ouvert pour la categorie "${category.name}".`);
  };

  const handleUploadCategoryDocument = async (categoryId, file) => {
    if (!file) {
      return;
    }

    const fileBuffer = await file.arrayBuffer();
    const documentUrl = URL.createObjectURL(file);

    setClassrooms((prev) =>
      prev.map((classroom) => ({
        ...classroom,
        categories: classroom.categories.map((category) =>
          category.id === categoryId
            ? {
                ...category,
                documents: (category.documents ?? 0) + 1,
                lastUpload: new Date().toISOString().slice(0, 10),
                activeDocument: {
                  id: `doc-${Date.now()}`,
                  name: file.name,
                  size: file.size,
                  type: file.type,
                  data: Array.from(new Uint8Array(fileBuffer)),
                  url: documentUrl,
                },
                documentTitle: file.name,
                documentSnippets: [
                  `Document PDF importe : ${file.name}`,
                  "Apercu disponible dans la gestion des classes.",
                  "Cliquez sur Labeling pour commencer l'annotation des attributs.",
                ],
              }
            : category,
        ),
      })),
    );

    pushMessage(`Le document "${file.name}" a ete importe dans la categorie selectionnee.`);
  };

  const handleStartLabeling = (category) => {
    setLabelingCategoryId(category.id);
    setActiveSection("classes");
    setDraftAttribute("");
    setDraftAttributeSnippet("");
    setDraftValue("");
    pushMessage(`Workspace de labeling ouvert pour "${category.name}".`);
  };

  const handleUserHistory = (userItem) => {
    pushMessage(`Historique ouvert pour l'utilisateur "${userItem.name ?? userItem.fullName}".`);
  };

  const handleUserDelete = async (userItem) => {
    try {
      await deleteUser(userItem.id, token);
      setUsers((prev) => prev.filter((item) => item.id !== userItem.id));
      pushMessage(`L'utilisateur "${userItem.name ?? userItem.fullName}" a ete supprime.`);
    } catch (err) {
      pushMessage(`Suppression user echouee: ${err.message}`);
    }
  };

  const handleSaveLabel = () => {
    if (!selectedCategory || !draftAttribute || !draftAttributeSnippet.trim() || !draftValue.trim()) {
      pushMessage("Selectionnez l'attribut, sa zone en jaune et la valeur en bleu avant d'enregistrer.");
      return;
    }

    setClassrooms((prev) =>
      prev.map((classroom) => ({
        ...classroom,
        categories: classroom.categories.map((category) =>
          category.id === selectedCategory.id
            ? {
                ...category,
                labeledFields: [
                  ...category.labeledFields,
                  {
                    id: `lab-${Date.now()}`,
                    attribute: draftAttribute,
                    attributeSnippet: draftAttributeSnippet.trim(),
                    value: draftValue.trim(),
                    attributeColor: "#f2c94c",
                    valueColor: "#56ccf2",
                  },
                ],
              }
            : category,
        ),
      })),
    );
    setDraftAttribute("");
    setDraftAttributeSnippet("");
    setDraftValue("");
    pushMessage("Le labeling a ete enregistre dans la categorie selectionnee.");
  };

  const resetControlForm = () => {
    setControlForm({
      name: "",
      description: "",
      status: "todo",
      dueDate: "",
      documentId: "",
      assignedTo: "",
    });
  };

  const handleControlFormChange = (field, value) => {
    setControlForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddControlPoint = async () => {
    if (!controlForm.name.trim()) {
      pushMessage("Le nom du point de controle est obligatoire.");
      return;
    }

    try {
      const createdPoint = await createControlPoint(
        {
          name: controlForm.name.trim(),
          description: controlForm.description.trim() || null,
          status: controlForm.status,
          due_date: controlForm.dueDate || null,
          document_id: controlForm.documentId ? Number(controlForm.documentId) : null,
          assigned_to: controlForm.assignedTo ? Number(controlForm.assignedTo) : null,
        },
        token,
      );
      setControlPoints((prev) => [createdPoint, ...prev]);
      resetControlForm();
      pushMessage("Un nouveau point de controle a ete ajoute.");
    } catch (err) {
      pushMessage(`Ajout point de controle echoue: ${err.message}`);
    }
  };

  const handleDeleteControlPoint = async (id) => {
    try {
      await deleteControlPoint(id, token);
      setControlPoints((prev) => prev.filter((item) => item.id !== id));
      pushMessage("Le point de controle a ete supprime.");
    } catch (err) {
      pushMessage(`Suppression point de controle echouee: ${err.message}`);
    }
  };

  const handleDocumentFormChange = (field, value) => {
    setDocumentForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddDocument = async () => {
    if (!documentForm.title.trim()) {
      pushMessage("Le titre du document est obligatoire.");
      return;
    }

    try {
      const createdDocument = await createDocument(
        {
          title: documentForm.title.trim(),
          description: documentForm.description.trim() || null,
          status: documentForm.status,
          created_by: documentForm.createdBy ? Number(documentForm.createdBy) : null,
        },
        token,
      );

      setDocuments((prev) => [createdDocument, ...prev]);
      setDocumentForm({
        title: "",
        description: "",
        status: "draft",
        createdBy: "",
      });
      pushMessage("Document ajoute avec succes.");
    } catch (err) {
      pushMessage(`Ajout document echoue: ${err.message}`);
    }
  };

  const handleDeleteDocument = async (id) => {
    try {
      await deleteDocument(id, token);
      setDocuments((prev) => prev.filter((item) => item.id !== id));
      pushMessage("Document supprime avec succes.");
    } catch (err) {
      pushMessage(`Suppression document echouee: ${err.message}`);
    }
  };

  let content = null;

  if (loadingRemote) {
    content = <div className="auth-loading-state">Chargement des donnees backend...</div>;
  } else if (activeSection === "dashboard") {
    content = (
      <DashboardSection
        usersCount={users.length}
        classroomsCount={classrooms.length}
        dashboardsCount={dashboards.length}
        documentsCount={documents.length}
        controlPointsCount={controlPoints.length}
        recentDocuments={documents.slice(0, 6)}
        feedback={workspaceMessage}
      />
    );
  } else if (activeSection === "users") {
    content = (
      <UsersManagementSection
        users={users}
        feedback={workspaceMessage}
        onHistory={handleUserHistory}
        onDelete={handleUserDelete}
      />
    );
  } else if (activeSection === "documents") {
    content = (
      <DocumentsManagementSection
        documents={documents}
        users={users}
        feedback={workspaceMessage}
        form={documentForm}
        onFormChange={handleDocumentFormChange}
        onAdd={handleAddDocument}
        onDelete={handleDeleteDocument}
      />
    );
  } else if (activeSection === "control-points") {
    content = (
      <ControlPointsSection
        points={controlPoints}
        documents={documents}
        users={users}
        feedback={workspaceMessage}
        form={controlForm}
        onFormChange={handleControlFormChange}
        onReset={resetControlForm}
        onAdd={handleAddControlPoint}
        onDelete={handleDeleteControlPoint}
      />
    );
  } else if (selectedCategory) {
    content = (
      <LabelingWorkspace
        category={selectedCategory}
        draftAttribute={draftAttribute}
        draftAttributeSnippet={draftAttributeSnippet}
        draftValue={draftValue}
        onDraftAttributeChange={setDraftAttribute}
        onDraftAttributeSnippetChange={setDraftAttributeSnippet}
        onDraftValueChange={setDraftValue}
        onSnippetPick={setDraftValue}
        onSaveLabel={handleSaveLabel}
        onBack={() => {
          setLabelingCategoryId(null);
          setDraftAttributeSnippet("");
          pushMessage("Retour a la liste des classes.");
        }}
      />
    );
  } else {
    content = (
      <ClassManagementSection
        classrooms={classrooms}
        feedback={workspaceMessage}
        onAddClass={handleAddClass}
        onAddCategory={handleAddCategory}
        onAction={handleCategoryAction}
        onUploadDocument={handleUploadCategoryDocument}
        onStartLabeling={handleStartLabeling}
      />
    );
  }

  return (
    <section className="workspace-shell">
      <WorkspaceNavbar
        activeSection={activeSection}
        onSectionChange={(section) => {
          setActiveSection(section);
          if (section !== "classes") {
            setLabelingCategoryId(null);
          }
        }}
        user={user}
        onSignOut={onSignOut}
        submitting={submitting}
      />
      <div className="workspace-content">{content}</div>
    </section>
  );
}

export default AppWorkspace;
