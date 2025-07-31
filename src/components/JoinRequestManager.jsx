/**
 * Component for community managers to view and approve/reject join requests
 */
import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  arrayUnion,
} from "firebase/firestore";
import styles from "./JoinRequestManager.module.css";

const JoinRequestManager = ({ communityId, user, onRequestHandled }) => {
  const [joinRequests, setJoinRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    fetchJoinRequests();
  }, [communityId]);

  const fetchJoinRequests = async () => {
    try {
      const requestsQuery = query(
        collection(db, "joinRequests"),
        where("communityId", "==", communityId),
        where("status", "==", "pending")
      );

      const snapshot = await getDocs(requestsQuery);
      const requests = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setJoinRequests(requests);
    } catch (error) {
      console.error("Error fetching join requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId, userId) => {
    setProcessing({ ...processing, [requestId]: true });

    try {
      // Add user to community members
      const communityRef = doc(db, "communities", communityId);
      await updateDoc(communityRef, {
        members: arrayUnion(userId),
      });

      // Delete the join request
      await deleteDoc(doc(db, "joinRequests", requestId));

      // Remove from local state
      setJoinRequests((requests) =>
        requests.filter((req) => req.id !== requestId)
      );

      if (onRequestHandled) {
        onRequestHandled();
      }
    } catch (error) {
      console.error("Error approving join request:", error);
    } finally {
      setProcessing({ ...processing, [requestId]: false });
    }
  };

  const handleReject = async (requestId) => {
    setProcessing({ ...processing, [requestId]: true });

    try {
      // Delete the join request
      await deleteDoc(doc(db, "joinRequests", requestId));

      // Remove from local state
      setJoinRequests((requests) =>
        requests.filter((req) => req.id !== requestId)
      );

      if (onRequestHandled) {
        onRequestHandled();
      }
    } catch (error) {
      console.error("Error rejecting join request:", error);
    } finally {
      setProcessing({ ...processing, [requestId]: false });
    }
  };

  if (loading) {
    return <div className={styles.loading}>Caricamento richieste...</div>;
  }

  if (joinRequests.length === 0) {
    return (
      <div className={styles.noRequests}>
        Nessuna richiesta di adesione in attesa.
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Richieste di Adesione</h3>
      <div className={styles.requestsList}>
        {joinRequests.map((request) => (
          <div key={request.id} className={styles.requestCard}>
            <div className={styles.requestInfo}>
              <strong>{request.userEmail}</strong>
              <span className={styles.date}>
                {request.created?.toDate().toLocaleDateString()}
              </span>
            </div>
            <div className={styles.actions}>
              <button
                className={styles.approveButton}
                onClick={() => handleApprove(request.id, request.userId)}
                disabled={processing[request.id]}
              >
                {processing[request.id] ? "..." : "Approva"}
              </button>
              <button
                className={styles.rejectButton}
                onClick={() => handleReject(request.id)}
                disabled={processing[request.id]}
              >
                {processing[request.id] ? "..." : "Rifiuta"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JoinRequestManager;
