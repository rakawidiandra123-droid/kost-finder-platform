import Map "mo:core/Map";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";
import Expose "mo:caffeineai-oql/Expose";
import Entity "mo:caffeineai-oql/Entity";
import MapEntity "mo:caffeineai-oql/MapEntity";
import NatValue "mo:caffeineai-oql/NatValue";
import TextValue "mo:caffeineai-oql/TextValue";
import IntValue "mo:caffeineai-oql/IntValue";
import RoomTypes "types/rooms";
import BookingTypes "types/bookings";
import RoomsApi "mixins/rooms-api";
import BookingsApi "mixins/bookings-api";
import ApiDocMixin "mixins/api-doc";

actor {
  let accessControlState : AccessControl.AccessControlState;
  let rooms : Map.Map<RoomTypes.RoomId, RoomTypes.Room>;
  let bookings : Map.Map<BookingTypes.BookingId, BookingTypes.BookingRequest>;
  let nextRoomId : { var value : Nat };
  let nextBookingId : { var value : Nat };

  include MixinAuthorization(accessControlState, null);
  include MixinObjectStorage();
  include RoomsApi(rooms, nextRoomId, accessControlState);
  include BookingsApi(bookings, nextBookingId, accessControlState);
  include ApiDocMixin();

  include Expose({
    entities = [
      rooms.toEntityManual("room", "Room", "id")
        .sample({
          id = 0;
          name = "";
          roomType = #putra;
          monthlyPrice = 0;
          description = "";
          facilities = [];
          status = #available;
          photos = [];
        })
        .payload("id", func r = r.id)
        .payload("name", func r = r.name)
        .payload("roomType", func r = switch (r.roomType) {
          case (#putra) "putra";
          case (#putri) "putri";
          case (#campur) "campur";
        })
        .payload("monthlyPrice", func r = r.monthlyPrice)
        .payload("description", func r = r.description)
        .payload("facilityCount", func r = r.facilities.size())
        .payload("status", func r = switch (r.status) {
          case (#available) "available";
          case (#occupied) "occupied";
        })
        .payload("photoCount", func r = r.photos.size())
        .public_()
        .build(),
      bookings.toEntityManual("booking", "BookingRequest", "id")
        .sample({
          id = 0;
          applicantName = "";
          phone = "";
          email = "";
          moveInDate = "";
          message = "";
          roomId = 0;
          status = #pending;
          createdAt = 0;
        })
        .payload("id", func b = b.id)
        .payload("applicantName", func b = b.applicantName)
        .payload("phone", func b = b.phone)
        .payload("email", func b = b.email)
        .payload("moveInDate", func b = b.moveInDate)
        .payload("message", func b = b.message)
        .payload("roomId", func b = b.roomId)
        .payload("status", func b = switch (b.status) {
          case (#pending) "pending";
          case (#approved) "approved";
          case (#rejected) "rejected";
        })
        .payload("createdAt", func b = b.createdAt)
        .controllerOnly()
        .build(),
    ];
  });
};
