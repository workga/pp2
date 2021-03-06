import React, { Component } from 'react'
import { Toast } from "react-bootstrap"
import { connect } from "react-redux"
import { closeNotification } from "../../redux/actions"

class Notification extends Component {
   constructor(props){
      super(props);
      this.state = {
         visible: false
      }
   }
   handleClose(){
      this.props.closeNotification()
      this.setState({
         visible: false
      })
   }
   switcherType(type){
      switch(this.props.type) {
         case "warning": 
            return {
               backgroundColor: "yellow",
            }
         case "error":
            return {
               backgroundColor: "red",
               color: "white"
            }
         default:
            return {}
      }
   }
   componentDidMount(){
      this.props.notif.visible != this.state.visible ?
         this.setState({visible: this.props.notif.visible}):
         console.log("dfsdf")
   }
   render() {
      return ( 
         <div
            style={{
               position: 'fixed',
               bottom: "70px",
               right: "20px"
            }}
            >
            <Toast 
               show={this.state.visible} 
               onClose={this.handleClose.bind(this)} 
               // style={this.state.visible ? {display: "block"} : {display: "none"}}
               animation={true}
               delay={300}
               style={this.switcherType(this.props.notif.type)}
               // autohide={true}
            >
               <Toast.Header>
               <img src="holder.js/20x20?text=%20" className="rounded mr-2" alt="" />
               <strong className="mr-auto">{this.props.notif.title}</strong>
               <small>{this.props.time}</small>
               </Toast.Header>
               <Toast.Body>{this.props.notif.content}</Toast.Body>
            </Toast>
         </div>
       );
   }
}
 
const mapDispatchToProps = dispatch => ({
   closeNotification: () => dispatch(closeNotification())
})
const mapStateToProps = state => ({
   notif: state.app.notification
})
export default connect(mapStateToProps, mapDispatchToProps)(Notification);