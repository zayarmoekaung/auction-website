import { useState, useEffect, useContext } from "react";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";
import { itemStatus } from "../utils/itemStatus";
import { formatField, formatMoney } from "../utils/formatString";
import { updateProfile } from "firebase/auth";
import { doc, setDoc, updateDoc, collection, addDoc, query, where, getDocs, onSnapshot,   } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { ModalsContext } from "../contexts/ModalsProvider";
import { ModalTypes } from "../utils/modalTypes";
import BidHistory from "./BidHistory";

const Modal = ({ type, title, children }) => {
  const { closeModal, currentModal } = useContext(ModalsContext);

  if (type !== currentModal) return null;

  return ReactDOM.createPortal(
    <div
      className="modal fade show"
      style={{ display: "block" }}
      onClick={closeModal}
    >
      <div
        className="modal-dialog modal-dialog-centered modal-dialog-scrollable"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button className="btn-close" onClick={closeModal} />
          </div>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

Modal.propTypes = {
  type: PropTypes.string,
  title: PropTypes.string,
  children: PropTypes.arrayOf(PropTypes.element)
}

const ItemModal = ({ active }) => {
  const { activeItem, openModal, closeModal } = useContext(ModalsContext);
  const [secondaryImageSrc, setSecondaryImageSrc] = useState("");
  const minIncrease = 1000;
  const maxIncrease = 100000;
  const [bid, setBid] = useState("");
  const [valid, setValid] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [minBid, setMinBid] = useState("-.--");
  const [bidHistory, setBidHistory] = useState([]);

  useEffect(() => {
    if (activeItem.secondaryImage === undefined) return;
    import(`../assets/${activeItem.secondaryImage}.jpeg`).then((src) => {
      setSecondaryImageSrc(src.default);
    });
  }, [activeItem.secondaryImage]);

  useEffect(() => {
    const status = itemStatus(activeItem);
    setMinBid(formatMoney(activeItem.currency, status.amount + minIncrease));
  }, [activeItem]);

  useEffect(() => {
    const fetchBidHistory = async () => {
      if (!activeItem.id && activeItem.id != 0) {
        return;
      }
      try {
        const bidsRef = collection(db, "bids");
        const q = query(bidsRef, where("itemId", "==", activeItem.id));
        const querySnapshot = await getDocs(q);
        const history = querySnapshot.docs.map(doc => doc.data());
        setBidHistory(history);
      } catch (error) {
        console.error("Error fetching bid history: ", error);
      }
    };

    fetchBidHistory();
  }, [activeItem.id]);

  const delayedClose = () => {
    setTimeout(() => {
      closeModal();
      setFeedback("");
      setValid("");
    }, 1000);
  };

  const handleSubmitBid = async () => {
    let nowTime = new Date().getTime();
    setIsSubmitting(true);

    if (activeItem.endTime - nowTime < 0) {
      setFeedback("Sorry, this item has ended!");
      setValid("is-invalid");
      delayedClose();
      setIsSubmitting(false);
      return;
    }

    if (auth.currentUser.displayName == null) {
      setFeedback("You must signup before bidding!");
      setValid("is-invalid");
      setTimeout(() => {
        openModal(ModalTypes.SIGN_UP);
        setIsSubmitting(false);
        setValid("");
      }, 1000);
      return;
    }
    if (!active) {
      setFeedback("Your account is not activated!");
      setValid("is-invalid");
      setTimeout(() => {
        setIsSubmitting(false);
        setValid("");
      }, 1000);
      return;
    }

    if (!/^\d+(\.\d{1,2})?$/.test(bid)) {
      setFeedback("Please enter a valid monetary amount!");
      setValid("is-invalid");
      setIsSubmitting(false);
      return;
    }

    const amount = parseFloat(bid);
    const status = itemStatus(activeItem);

    if (amount < status.amount + minIncrease) {
      setFeedback("You did not bid enough!");
      setValid("is-invalid");
      setIsSubmitting(false);
      return;
    }

    if (amount > status.amount + maxIncrease) {
      setFeedback(`You can only increase the price up to ${activeItem.currency}${maxIncrease} per bid.`);
      setValid("is-invalid");
      setIsSubmitting(false);
      return;
    }

    // Save bid to the items document
    const itemRef = doc(db, "auction", "items");
    await updateDoc(itemRef, {
      [formatField(activeItem.id, status.bids + 1)]: {
        amount,
        uid: auth.currentUser.uid,
        username: auth.currentUser.displayName,
      },
    });

    // Save bid to the bids collection
    await addDoc(collection(db, "bids"), {
      itemId: activeItem.id,
      amount,
      uid: auth.currentUser.uid,
      username: auth.currentUser.displayName,
      timestamp: new Date(),
    });

    console.debug("handleSubmitBid() write to auction/items and bids");
    setValid("is-valid");
    delayedClose();
  };

  const handleChange = (e) => {
    setBid(e.target.value);
    setIsSubmitting(false);
    setValid("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !isSubmitting) {
      handleSubmitBid();
    }
  };

  return (
    <Modal type={ModalTypes.ITEM} title={activeItem.title}>
      <div className="modal-body">
        <p>{activeItem.detail}</p>
        <img src={secondaryImageSrc} className="img-fluid" alt={activeItem.title} />
        <BidHistory history={bidHistory} /> {/* Display bid history */}
      </div>
      <div className="modal-footer justify-content-start">
        <div className="input-group mb-2">
          <span className="input-group-text">{activeItem.currency}</span>
          <input
            className={`form-control ${valid}`}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          />
          <button
            type="submit"
            className="btn btn-primary"
            onClick={handleSubmitBid}
            disabled={isSubmitting}
          >
            Submit bid
          </button>
          <div className="invalid-feedback">{feedback}</div>
        </div>
        <label className="form-label">Enter {minBid} or more</label>
      </div>
    </Modal>
  );
};

const SignUpModal = () => {
  const { closeModal } = useContext(ModalsContext);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [valid, setValid] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhoneNumber = (phoneNumber) => {
    const re = /^\d{10}$/; // Simple validation for 10 digit phone number
    return re.test(phoneNumber);
  };

  const handleSignUp = () => {
    if (!validateEmail(email)) {
      setEmailError("Invalid email format");
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setPhoneError("Invalid phone number format");
      return;
    }

    const user = auth.currentUser;
    updateProfile(user, { displayName: username }).then(() => {
      setDoc(doc(db, "users", user.uid), {
        name: username,
        email: email,
        phoneNumber: phoneNumber,
        admin: "",
        active: "",
      }).then(() => {
        console.debug(`signUp() write to users/${user.uid}`);
        setValid("is-valid");
        setTimeout(() => {
          closeModal();
          setValid("");
        }, 1000);
      }).catch(error => {
        console.error("Error writing document: ", error);
      });
    }).catch(error => {
      console.error("Error updating profile: ", error);
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSignUp();
    }
  };

  return (
    <Modal type={ModalTypes.SIGN_UP} title="Sign up for Markatplace Auction">
      <div className="modal-body">
        <p>
          This is the pilot version of the website and  we use anonymous authentication provided by Google. Your account is
          attached to your device signature.
        </p>
        <p>The username just lets us know who&apos;s bidding!</p>
        <p className="text-danger">
          Note: We use Google anonymous authentication, which links your account to your device.
          This means that if you log out or clear your browser data, your account and its data will be lost.
        </p>
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="form-floating mb-3">
            <input
              autoFocus
              id="username-input"
              type="text"
              className={`form-control ${valid}`}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <label htmlFor="username-input">Username</label>
          </div>
          <div className="form-floating mb-3">
            <input
              id="email-input"
              type="email"
              className={`form-control ${emailError ? "is-invalid" : ""}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <label htmlFor="email-input">Email</label>
            {emailError && <div className="invalid-feedback">{emailError}</div>}
          </div>
          <div className="form-floating mb-3">
            <input
              id="phone-input"
              type="tel"
              className={`form-control ${phoneError ? "is-invalid" : ""}`}
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <label htmlFor="phone-input">Phone Number</label>
            {phoneError && <div className="invalid-feedback">{phoneError}</div>}
          </div>
          <div className="form-check mb-3">
            <input
              type="checkbox"
              className="form-check-input"
              id="acknowledge-check"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="acknowledge-check">
              I acknowledge that my account will be lost if I log out or clear my browser data.
            </label>
          </div>
        </form>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={closeModal}>
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          onClick={handleSignUp}
          disabled={!acknowledged}
        >
          Sign up
        </button>
      </div>
    </Modal>
  );
};

export { ItemModal, SignUpModal };
