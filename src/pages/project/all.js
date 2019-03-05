import React, { Component } from 'react';
import { Card, Icon, message, Dropdown, Menu, Modal } from 'antd';
import { projects } from 'request';
import style from './index.less';
import router from 'umi/router';
import { connect } from 'dva';
import Create from './create';
import { record, Replayer } from 'rrweb';
import rrwebPlayer from 'rrweb-player';
import Prompt from 'components/Prompt.js'
const confirm = Modal.confirm;
class AllProjects extends Component {
  state = {
    my: [],
    participant: [],
  };
  componentDidMount() {
    this.getProjectList();
  }
  record = () => {
    let events = [];
    let stopFn = record({
      emit(event) {
        // 将 event 存入 events 数组中
        // if (events.length > 10) {
        //   // 当事件数量大于 100 时停止录制
        //   stopFn();
        // }
        events.push(event);
      },
    });
    this.stopFn = stopFn;
    this.events = events;
  };
  getProjectList = () => {
    const userId = JSON.parse(localStorage.getItem('user'))._id;
    projects
      .getProjectsList({
        params: {
          creator_id: userId,
        },
      })
      .then(req => {
        if (req && req.data) {
          const { my, participant } = req.data;
          this.setState({
            my,
            participant,
          });
        }
      });
  };
  getProjectDetail = _id => {
    const { dispatch } = this.props;
    projects
      .getProjectsDetail({
        params: {
          _id,
        },
      })
      .then(req => {
        if (req) {
          const { data } = req;
          if (data) {
            dispatch({
              type: 'projects_all/updateState',
              payload: {
                detail: data,
              },
            });
            router.push('/project/detail');
          }
        }
      });
  };
  delete = (id) => {
    const _this = this;
    if (!id) {
      return;
    }
    confirm({
      title: '确定删除吗?',
      content: '',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk() {
        projects
          .deleteProject({
            params: {
              _id: id,
            },
          })
          .then(res => {
            if (res.code === 1000) {
              message.success('删除成功！');
              _this.getProjectList();
            }
          });
      },
      onCancel() {
        console.log('Cancel');
      },
    });
  };
  rename = (id) => {
    Prompt({
      title: '重命名',
      placeHolder: '请填写名称',
      onOk: ({text}) => {
        projects
        .renameProject({
          params: {
            _id: id,
            name: text
          },
        })
        .then(res => {
          if (res.code === 1000) {
            message.success('操作成功！');
            this.getProjectList();
          }
        });
      }
    })
    
  }
  onMenuClick = ({item, key, keyPath}, id) => {
    if (key === '1') {
      this.rename(id);
    }
    if (key === '3') {
      this.delete(id);
    }
  };
  menu = (id) => (
    <Menu onClick={(params) => this.onMenuClick(params, id)}>
      <Menu.Item key="1">重命名</Menu.Item>
      <Menu.Divider />
      <Menu.Item key="3">删除</Menu.Item>
    </Menu>
  );
  myProjects = my => {
    return my.map(m => {
      return (
        <Card
          key={m._id}
          title={<span title={m.group_name} onClick={() => this.getProjectDetail(m._id)}>{m.group_name}</span>}
          className={style.card}
          hoverable={true}
          actions={[
            <Dropdown overlay={() => this.menu(m._id)} trigger={['click']}>
              <Icon type="setting" />
            </Dropdown>,
            <Icon type="ellipsis" />,
          ]}
          extra={<span>创建者：{m.creator_name}</span>}
        >
          <p className={style.p}>成员：{m.members.length === 0 && '暂无'}</p>
          {m.members.map((p, idx) => {
            return (
              <p className={style.p} key={idx}>
                {p.name}
              </p>
            );
          })}
          <p style={{ margin: '0 5px' }}>文章数：{m.posts.length} 篇</p>
        </Card>
      );
    });
  };
  participantProjects = participant => {
    return participant.map(m => {
      return (
        <Card
          title={m.group_name}
          key={m._id}
          className={style.card}
          onClick={() => this.getProjectDetail(m._id)}
          actions={[<Icon type="setting" />, <Icon type="edit" />, <Icon type="ellipsis" />]}
          extra={<span>创建者：{m.creator_name}</span>}
        >
          <p className={style.p}>成员：{m.members.length === 0 && '暂无'}</p>
          {m.members.map((p, idx) => {
            return (
              <p className={style.p} key={idx}>
                {p.name}
              </p>
            );
          })}
        </Card>
      );
    });
  };
  createProject = values => {
    const userId = JSON.parse(localStorage.getItem('user'))._id;
    projects
      .createProject({
        params: {
          creator_id: userId,
          ...values,
        },
      })
      .then(res => {
        if (res.code === 1000) {
          message.success('新建成功！');
          this.closeModel();
          this.getProjectList();
        }
      });
  };
  openModel = () => {
    this.setState({
      visible: true,
    });
  };
  closeModel = () => {
    this.setState({
      visible: false,
    });
  };
  replay = () => {
    const { events = [], stopFn } = this;
    stopFn();
    const player = new rrwebPlayer({
      target: document.body, // 可以自定义 DOM 元素
      data: {
        events,
      },
    });
    // player.destroy()
  };
  render() {
    const { my, participant, detail } = this.state;
    return (
      <div className={style.cardContinerWarp}>
        <h3>我创建的</h3>
        {/* <Button onClick={this.record}>record</Button>
        <Button onClick={this.replay}>replay</Button> */}
        <div className={style.cardContent}>
          {this.myProjects(my)}
          <div
            key={'new'}
            className={style.card}
            style={{ border: '1px solid #e8e8e8', cursor: 'pointer' }}
            onClick={this.openModel}
          >
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              <Icon
                type="plus"
                style={{
                  fontSize: '36px',
                  transform: 'translate(-50%, -50%)',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                }}
              />
            </div>
          </div>
        </div>

        <h3>我参与的</h3>
        {/* <Prompt></Prompt> */}
        <div className={style.cardContent}>{this.participantProjects(participant)}</div>
        <Create
          visible={this.state.visible}
          createProject={this.createProject}
          onCancel={this.closeModel}
        />
      </div>
    );
  }
}

export default connect(state => ({}))(AllProjects);
