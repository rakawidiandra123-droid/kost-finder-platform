import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
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

  // Configured admin principal, read from the ADMIN_PRINCIPAL canister
  // environment variable. Transient: re-read on every canister start, so it is
  // always current and needs no migration. When set, that principal can claim
  // #admin through claimAdmin() even if another admin already exists.
  transient let configuredAdmin : ?Principal = switch (Runtime.envVar<system>("ADMIN_PRINCIPAL")) {
    case (?text) { ?Principal.fromText(text) };
    case null { null };
  };

  // Deterministic, recoverable admin bootstrap. The authorization package
  // grants #admin to the FIRST non-anonymous caller (first-caller-wins); on a
  // live canister that slot may already be claimed by a different principal,
  // leaving the app owner registered as #user. This endpoint does not depend on
  // being the first caller:
  //   * already admin -> no-op (idempotent);
  //   * caller == configuredAdmin -> granted #admin even if another admin exists;
  //   * no admin assigned yet -> caller becomes admin;
  //   * otherwise -> trap, directing the caller to an existing admin.
  public shared ({ caller }) func claimAdmin() : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Harus masuk untuk mengklaim akses admin");
    };
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return;
    };
    let isConfigured = switch (configuredAdmin) {
      case (?admin) { Principal.equal(admin, caller) };
      case null { false };
    };
    if (isConfigured or not accessControlState.adminAssigned) {
      accessControlState.userRoles.add(caller, #admin);
      accessControlState.adminAssigned := true;
      return;
    };
    Runtime.trap("Admin sudah ditetapkan; minta admin yang ada memberikan peran");
  };

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
