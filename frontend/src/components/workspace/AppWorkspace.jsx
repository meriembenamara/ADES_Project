import { useEffect, useMemo, useState } from "react";
import { initialClassrooms } from "../../data/mockWorkspace";
import {
  createControlPoint,
  createDocument,
  createLabeling,
  createTrainingSample,
  deleteControlPoint,
  deleteDocument,
  deleteUser,
  fetchControlPoints,
  fetchDashboards,
  fetchDocuments,
  fetchUsers,
  uploadDocumentForLabeling,
} from "../../services/workspaceApi";
import ClassManagementSection from "./ClassManagementSection";
import ControlPointsSection from "./ControlPointsSection";
import DashboardSection from "./DashboardSection";
import DocumentsManagementSection from "./DocumentsManagementSection";
import LabelingWorkspace from "./LabelingWorkspace";
import MLTrainingPanel from "../MLTrainingPanel";
import MLPredictionPanel from "../MLPredictionPanel";
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
  const [draftLabelId, setDraftLabelId] = useState(null);
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
    if (!user?.id) {
      return;
    }

    setUsers((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === user.id);

      if (existingIndex === -1) {
        return [user, ...prev];
      }

      return prev.map((item) => (item.id === user.id ? { ...item, ...user } : item));
    });
  }, [user]);

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

  useEffect(() => {
    if (!token || !["users", "documents", "control-points"].includes(activeSection)) {
      return;
    }

    fetchUsers(token)
      .then((usersData) => {
        setUsers(Array.isArray(usersData) ? usersData : []);
      })
      .catch((err) => {
        pushMessage(`Actualisation users echouee: ${err.message}`);
      });
  }, [activeSection, token]);

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
    const targetCategory =
      classrooms.flatMap((classroom) => classroom.categories).find((category) => category.id === categoryId) ?? null;

    let persistedDocument = null;

    try {
      persistedDocument = await uploadDocumentForLabeling(
        {
          title: file.name.replace(/\.pdf$/i, ""),
          description: targetCategory ? `Document importe pour la categorie ${targetCategory.name}` : "",
          status: "draft",
          class_key: classrooms.find((classroom) => classroom.categories.some((category) => category.id === categoryId))?.id,
          category_key: categoryId,
          created_by: user?.id,
          file,
        },
        token,
      );

      setDocuments((prev) => [persistedDocument, ...prev]);
    } catch (err) {
      pushMessage(`Upload document echoue: ${err.message}`);
      return;
    }

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
                  id: persistedDocument?.id ?? `doc-${Date.now()}`,
                  name: file.name,
                  size: file.size,
                  type: file.type,
                  data: Array.from(new Uint8Array(fileBuffer)),
                  url: documentUrl,
                  backendDocumentId: persistedDocument?.id ?? null,
                  backendFilePath: persistedDocument?.file_path ?? null,
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
    setDraftLabelId(null);
    pushMessage(`Workspace de labeling ouvert pour "${category.name}".`);
  };

  const buildDraftLabelRecord = () => {
    const attributeName = (draftAttribute || draftAttributeSnippet).trim();
    const attributeSnippet = draftAttributeSnippet.trim() || attributeName;
    const value = draftValue.trim();

    if (!attributeName || !value) {
      return null;
    }

    return {
      id: draftLabelId ?? `lab-${Date.now()}`,
      attribute: attributeName,
      attributeSnippet,
      value,
      attributeColor: "#f2c94c",
      valueColor: "#56ccf2",
      isPending: true,
    };
  };

  const handleAddDraftLabel = () => {
    if (!selectedCategory) {
      return false;
    }

    const labelRecord = buildDraftLabelRecord();

    if (!labelRecord) {
      pushMessage("Selectionnez un attribut et sa valeur avant d'ajouter l'attribut.");
      return false;
    }

    setClassrooms((prev) =>
      prev.map((classroom) => ({
        ...classroom,
        categories: classroom.categories.map((category) =>
          category.id === selectedCategory.id
            ? {
                ...category,
                labeledFields: draftLabelId
                  ? category.labeledFields.map((field) =>
                      field.id === draftLabelId ? labelRecord : field,
                    )
                  : [...category.labeledFields, labelRecord],
                attributeOptions: category.attributeOptions.includes(labelRecord.attribute)
                  ? category.attributeOptions
                  : [...category.attributeOptions, labelRecord.attribute],
              }
            : category,
        ),
      })),
    );
    setDraftAttribute("");
    setDraftAttributeSnippet("");
    setDraftValue("");
    setDraftLabelId(null);
    pushMessage(`Attribut ajoute a l'extraction ciblee: ${labelRecord.attribute}.`);

    return true;
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

  const handleGoToTraining = () => {
    setLabelingCategoryId(null);
    setActiveSection("ml");
    pushMessage("Labeling enregistre. Passage à l'interface d'entraînement ML.");
  };

  const handleGoToPredictions = () => {
    setLabelingCategoryId(null);
    setActiveSection("ml-predictions");
    pushMessage("Passage a l'interface de prediction ML.");
  };

  const handleSaveLabel = async () => {
    if (!selectedCategory) {
      pushMessage("Ouvrez une categorie de labeling avant d'enregistrer.");
      return false;
    }

    const currentDraftRecord = buildDraftLabelRecord();
    const pendingLabelRecords = selectedCategory.labeledFields.filter((field) => field.isPending);
    const recordsToSave = currentDraftRecord
      ? [...pendingLabelRecords.filter((field) => field.id !== currentDraftRecord.id), currentDraftRecord]
      : pendingLabelRecords;

    if (recordsToSave.length === 0) {
      pushMessage("Ajoutez au moins un attribut avec sa valeur avant d'enregistrer.");
      return false;
    }

    try {
      const classKey =
        classrooms.find((classroom) =>
          classroom.categories.some((category) => category.id === selectedCategory.id),
        )?.id ?? null;

      let backendDocumentId = selectedCategory.activeDocument?.backendDocumentId ?? null;

      if (!backendDocumentId) {
        const createdDocument = await createDocument(
          {
            title: selectedCategory.documentTitle || `${selectedCategory.name} - Labeling`,
            description: `Document de labeling pour la categorie ${selectedCategory.name}`,
            status: "draft",
            created_by: user?.id ?? null,
            class_key: classKey,
            category_key: selectedCategory.id,
          },
          token,
        );

        backendDocumentId = createdDocument?.id ?? null;

        if (!backendDocumentId) {
          throw new Error("Aucun document backend n'a pu etre cree pour ce labeling.");
        }

        setDocuments((prev) => [createdDocument, ...prev]);
        setClassrooms((prev) =>
          prev.map((classroom) => ({
            ...classroom,
            categories: classroom.categories.map((category) =>
              category.id === selectedCategory.id
                ? {
                    ...category,
                    activeDocument: {
                      ...(category.activeDocument ?? {
                        id: `doc-${Date.now()}`,
                        name: category.documentTitle ?? createdDocument.title,
                        size: 0,
                        type: "application/pdf",
                        data: null,
                        url: null,
                      }),
                      backendDocumentId,
                      backendFilePath: createdDocument.file_path ?? null,
                    },
                  }
                : category,
            ),
          })),
        );
      }

      const createdEntries = await Promise.all(
        recordsToSave.map(async (labelRecord) => {
          const createdLabeling = await createLabeling(
            {
              document_id: backendDocumentId,
              user_id: user?.id ?? null,
              class_key: classKey,
              category_key: selectedCategory.id,
              attribute_name: labelRecord.attribute,
              attribute_snippet: labelRecord.attributeSnippet,
              attribute_value: labelRecord.value,
            },
            token,
          );

          const createdTrainingSample = await createTrainingSample(
            {
              document_id: backendDocumentId,
              user_id: user?.id ?? null,
              class_key: classKey,
              category_key: selectedCategory.id,
              attribute_name: labelRecord.attribute,
              attribute_snippet: labelRecord.attributeSnippet,
              attribute_value: labelRecord.value,
              labels_payload: {
                labels: [
                  {
                    attribute: labelRecord.attribute,
                    attribute_snippet: labelRecord.attributeSnippet,
                    value: labelRecord.value,
                  },
                ],
              },
            },
            token,
          );

          return {
            localId: labelRecord.id,
            createdLabeling,
            createdTrainingSample,
          };
        }),
      );

      setClassrooms((prev) =>
        prev.map((classroom) => ({
          ...classroom,
          categories: classroom.categories.map((category) =>
            category.id === selectedCategory.id
              ? {
                  ...category,
                  labeledFields: [
                    ...category.labeledFields
                      .filter((field) => !currentDraftRecord || field.id !== currentDraftRecord.id)
                      .map((field) => (field.isPending ? { ...field, isPending: false } : field)),
                    ...(currentDraftRecord ? [{ ...currentDraftRecord, isPending: false }] : []),
                  ],
                  attributeOptions: recordsToSave.reduce(
                    (options, record) =>
                      options.includes(record.attribute) ? options : [...options, record.attribute],
                    category.attributeOptions,
                  ),
                }
              : category,
          ),
        })),
      );
      setDraftAttribute("");
      setDraftAttributeSnippet("");
      setDraftValue("");
      setDraftLabelId(null);
      pushMessage(
        `${createdEntries.length} attribut(s) enregistre(s) dans la base de donnees.`,
      );

      return true;
    } catch (err) {
      pushMessage(`Enregistrement labeling echoue: ${err.message}`);
      return false;
    }
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
  } else if (activeSection === "ml") {
    content = (
      <section className="workspace-section workspace-ml-section">
        <div className="workspace-section-header">
          <div>
            <h3 className="workspace-hero-title mb-0">Entrainement ML</h3>
          </div>
        </div>
        <MLTrainingPanel token={token} />
      </section>
    );
  } else if (activeSection === "ml-predictions") {
    content = (
      <section className="workspace-section workspace-ml-section">
        <div className="workspace-section-header">
          <div>
            <h3 className="workspace-hero-title mb-0">Predictions ML</h3>
          </div>
        </div>
        <MLPredictionPanel token={token} />
      </section>
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
        onDraftLabelIdChange={setDraftLabelId}
        onSnippetPick={setDraftValue}
        onAddDraftLabel={handleAddDraftLabel}
        onSaveLabel={handleSaveLabel}
        onGoToTraining={handleGoToTraining}
        onGoToPredictions={handleGoToPredictions}
        onBack={() => {
          setLabelingCategoryId(null);
          setDraftAttribute("");
          setDraftAttributeSnippet("");
          setDraftValue("");
          setDraftLabelId(null);
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
      <style>{`
        .workspace-ml-section {
          padding-bottom: 24px;
        }
      `}</style>
    </section>
  );
}

export default AppWorkspace;
