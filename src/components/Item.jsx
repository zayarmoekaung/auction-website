import { useState, useEffect, useContext } from "react";
import PropTypes from "prop-types";
import { itemStatus } from "../utils/itemStatus";
import { formatTime, formatMoney } from "../utils/formatString";
import { ModalsContext } from "../contexts/ModalsProvider";
import { ModalTypes } from "../utils/modalTypes";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebase/config";
import { auth } from "../firebase/config";
export const Item = ({ item }) => {
  const { openModal } = useContext(ModalsContext);
  const exchange = {
    usd: 0,
    yun: 0,
    bhat: 1,
  };
  const [primaryImageSrc, setPrimaryImageSrc] = useState("");
  const [bids, setBids] = useState(0);
  const [amount, setAmount] = useState(item.startingPrice);
  const [winner,setWinner] = useState("");
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const status = itemStatus(item);
    setBids(status.bids);
    if (status.winner) {
      getDoc(doc(db, "users", status.winner)).then((user) => {
        setWinner(user.get("email"));
      });
    } else {
      setWinner("");
    }
    setAmount(formatMoney(item.currency, status.amount));
  }, [item]);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const remaining = item.endTime - now;

      if (remaining > 0) {
        setTimeLeft(formatTime(remaining));
        requestAnimationFrame(updateTimer);
      } else if (item.startTime) {
        setTimeLeft("Item Ended");
      } else {
        setTimeLeft("Upcoming Item");
      }
    };

    requestAnimationFrame(updateTimer);
  }, [item.endTime]);

  useEffect(() => {
    import(`../assets/${item.primaryImage}.jpeg`).then((src) => {
      setPrimaryImageSrc(src.default);
    });
  }, [item.primaryImage]);

  return (
    <div className="col">
      <div className="card h-100" onClick={() => openModal(ModalTypes.ITEM, item)}>
        <img
          src={primaryImageSrc}
          className="card-img-top"
          alt={item.title}
        />
        <div className="card-body">
          <h5 className="title">{item.title}</h5>
          <h6 className="card-subtitle mb-2 text-body-secondary">{item.subtitle}</h6>
        </div>
        <ul className="list-group list-group-flush">
          <li className="list-group-item"><strong>{amount}</strong>
          { auth.currentUser.email == winner &&
            <p class="text-success">You are current winning bidder</p>
          }</li>
          <li className="list-group-item">{bids} bids  · {timeLeft}</li>
        </ul>
      </div>
    </div>
  );
};

Item.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.number.isRequired,
    startingPrice: PropTypes.number.isRequired,
    currency: PropTypes.string.isRequired,
    endTime: PropTypes.instanceOf(Date).isRequired,
    primaryImage: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string.isRequired,
  }).isRequired
};
