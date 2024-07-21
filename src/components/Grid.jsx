import { useContext } from "react";
import { Item } from "./Item";
import { ItemsContext } from "../contexts/ItemsProvider";

const Grid = () => {
  const { items } = useContext(ItemsContext);

  const ongoingItems = items.filter(item => item.startTime);
  const upcomingItems = items.filter(item => !item.startTime);

  return (
    <div className="container my-4">
      <section className="mb-5">
        <h2 className="text-center mb-4">Ongoing Auctions</h2>
        <div className="row row-cols-1 row-cols-md-3 g-4 justify-content-center">
          {ongoingItems.map((item) => (
            <Item key={item.id} item={item} />
          ))}
        </div>
      </section>
      
      <section className="mb-5">
        <h2 className="text-center mb-4">Upcoming Items</h2>
        <div className="row row-cols-1 row-cols-md-3 g-4 justify-content-center">
          {upcomingItems.map((item) => (
            <Item key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Grid;
